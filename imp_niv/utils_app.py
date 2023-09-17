import os
from flask import current_app, session
import pandas as pd

import json

from imp_niv.utils_db import get_dict_id_externo_nom_sensor, get_lectura_inicial, get_tres_ultimas_lecturas, get_ultima_referencia


def obtener_df_gsi(path):
    with open(path, 'r') as file:
        lista_serializada = json.load(file)
        df_gsi = [(itinerario[0], pd.DataFrame(json.loads(itinerario[1])))
                  for itinerario in lista_serializada]
    return df_gsi


def serializar_df_gsi(df_gsi):
    lista_serializada = [(itinerario[0], itinerario[1].to_json())
                         for itinerario in df_gsi]
    lista_serializada_json = json.dumps(lista_serializada)
    lista_serializada_json_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], 'processed_' + session.get('df_gsi_filename'))
    session['df_gsi_path'] = lista_serializada_json_path
    with open(lista_serializada_json_path, 'w') as outfile:
        outfile.write(lista_serializada_json)


def obtener_csv_gsi(df_gsi, fecha):
    try:
        df = df_gsi[0][1]
    except TypeError as e:
        df = df_gsi[1]
    df = df[['Nombre campo', 'Cota comp.']]
    df = df[df['Cota comp.'] != '']
    df['FECHA'] = fecha
    df = df[['FECHA', 'Nombre campo', 'Cota comp.']]
    nombres_campo = list(df['Nombre campo'])
    dict_nom_sensor = get_dict_id_externo_nom_sensor(nombres_campo)
    df['NOM_SENSOR'] = df['Nombre campo'].map(dict_nom_sensor)
    df = df[['FECHA', 'Nombre campo', 'NOM_SENSOR', 'Cota comp.']]
    df_ids_inexistentes = df[df['NOM_SENSOR'].isnull()].copy()
    df_ids_existentes = df[df['NOM_SENSOR'].notnull()].copy()
    if not df_ids_existentes.empty:
        nom_sensor_list = list(df_ids_existentes['NOM_SENSOR'])
        dict_ultimas_lecturas, dict_penultimas_lecturas, dict_antepenultimas_lecturas = get_tres_ultimas_lecturas(
            nom_sensor_list)
        df_ids_existentes['ULT_LECT'] = df_ids_existentes['NOM_SENSOR'].map(
            dict_ultimas_lecturas)
        df_ids_existentes['PENULT_LECT'] = df_ids_existentes['NOM_SENSOR'].map(
            dict_penultimas_lecturas)
        df_ids_existentes['ANTEPENULT_LECT'] = df_ids_existentes['NOM_SENSOR'].map(
            dict_antepenultimas_lecturas)
        dict_fecha_ultima_referencia, dict_lectura_ultima_referencia, dict_medida_ultima_referencia = get_ultima_referencia(
            nom_sensor_list)
        df_ids_existentes['FECHA_REF'] = df_ids_existentes['NOM_SENSOR'].map(
            dict_fecha_ultima_referencia)
        df_ids_existentes['LECTURA_REF'] = df_ids_existentes['NOM_SENSOR'].map(
            dict_lectura_ultima_referencia)
        df_ids_existentes['MEDIDA_REF'] = df_ids_existentes['NOM_SENSOR'].map(
            dict_medida_ultima_referencia)
        dict_fecha_inicial, dict_lectura_inicial, dict_medida_inicial = get_lectura_inicial(
            nom_sensor_list)

        def replace_fecha_based_on_condition(row):
            if pd.isna(row['FECHA_REF']):
                return dict_fecha_inicial.get(row['NOM_SENSOR'], None)
            return row['FECHA_REF']

        def replace_lectura_based_on_condition(row):
            if pd.isna(row['LECTURA_REF']):
                return dict_lectura_inicial.get(row['NOM_SENSOR'], None)
            return row['LECTURA_REF']

        def replace_medida_based_on_condition(row):
            if pd.isna(row['MEDIDA_REF']):
                return dict_medida_inicial.get(row['NOM_SENSOR'], None)
            return row['MEDIDA_REF']

        df_ids_existentes['FECHA_REF'] = df_ids_existentes.apply(
            replace_fecha_based_on_condition, axis=1)
        df_ids_existentes['LECTURA_REF'] = df_ids_existentes.apply(
            replace_lectura_based_on_condition, axis=1)
        df_ids_existentes['MEDIDA_REF'] = df_ids_existentes.apply(
            replace_medida_based_on_condition, axis=1)

        df_ids_existentes['MEDIDA'] = (df_ids_existentes['Cota comp.'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float)
        df_ids_existentes['DIF_ULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - (
            (df_ids_existentes['ULT_LECT'].astype(float) - df_ids_existentes['LECTURA_REF'].astype(
                float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float)
        )
        df_ids_existentes['DF_PENULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - (
            (df_ids_existentes['PENULT_LECT'].astype(float) - df_ids_existentes['LECTURA_REF'].astype(
                float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float)
        )
        df_ids_existentes['DF_ANTEPENULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - (
            (df_ids_existentes['ANTEPENULT_LECT'].astype(float) - df_ids_existentes['LECTURA_REF'].astype(
                float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float)
        )
    return df_ids_existentes, df_ids_inexistentes
