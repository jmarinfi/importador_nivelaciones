from ftplib import FTP
import os
import re
from flask import current_app, send_file, session
import pandas as pd

import json

from imp_niv.utils_db import get_dict_id_externo_nom_sensor, get_lectura_inicial, get_tres_ultimas_lecturas, get_ultima_referencia


def deserializar_df_gsi(path):
    with open(path, 'r') as file:
        lista_serializada = json.load(file)
        df_gsi = [(itinerario[0], pd.DataFrame(json.loads(itinerario[1])))
                  for itinerario in lista_serializada]
    return df_gsi


def deserializar_csv_gsi_list(path):
    return deserializar_df_gsi(path)


def deserializar_csv_gsi(path):
    with open(path, 'r') as file:
        return pd.DataFrame(json.loads(file.read()))


def serializar_df_gsi(df_gsi):
    lista_serializada = [(itinerario[0], itinerario[1].to_json())
                         for itinerario in df_gsi]
    lista_serializada_json = json.dumps(lista_serializada)
    lista_serializada_json_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], 'processed_' + session.get('df_gsi_filename'))
    session['df_gsi_path'] = lista_serializada_json_path
    with open(lista_serializada_json_path, 'w') as outfile:
        outfile.write(lista_serializada_json)


def serializar_csv_gsi(csv_gsi, itinerario):
    df_serializado = csv_gsi.to_json()
    df_serializado_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], f'csv_gsi_{itinerario}_' + session.get('df_gsi_filename'))
    session['csv_gsi_path'] = df_serializado_path
    with open(df_serializado_path, 'w') as outfile:
        outfile.write(df_serializado)


def serializar_csv_gsi_list(csv_gsi_list):
    lista_serializada = [(itinerario[0], itinerario[1].to_json())
                         for itinerario in csv_gsi_list]
    lista_serializada_json = json.dumps(lista_serializada)
    lista_serializada_json_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], 'csv_gsi_list_' + session.get('df_gsi_filename'))
    session['csv_gsi_list_path'] = lista_serializada_json_path
    with open(lista_serializada_json_path, 'w') as outfile:
        outfile.write(lista_serializada_json)


def enviar_por_ftp(local_file_path, remote_file_name):
    with FTP(host=os.getenv('FTP_MONC_SERV'), user=os.getenv('FTP_MONC_USER'), passwd=os.getenv('FTP_MONC_PASSW')) as ftp:
        with open(local_file_path, 'rb') as text_file:
            ftp.cwd('/LIMA/Linea_2')
            ftp.storlines('STOR ' + remote_file_name, text_file)


def enviar_csv(df, itinerario):
    filename = session.get('df_gsi_filename')
    csv_filename = re.sub(r'\.gsi', '.csv',
                          filename, flags=re.IGNORECASE)
    csv_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], f'csv_{itinerario}_' + csv_filename)
    session['csv_path'] = csv_path
    df.to_csv(csv_path, sep=';', header=False, index=False)

    local_file_path = csv_path
    remote_file_name = f'csv_{itinerario}_' + csv_filename
    enviar_por_ftp(local_file_path, remote_file_name)


def enviar_csv_ids_inex(df, itinerario):
    filename = session.get('df_gsi_filename')
    csv_filename = re.sub(r'\.gsi', '.csv',
                          filename, flags=re.IGNORECASE)
    csv_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], f'csv_ids_inex_{itinerario}_' + csv_filename)
    session['csv_path'] = csv_path
    df.to_csv(csv_path, sep=';', header=False, index=False)

    # local_file_path = csv_path
    # remote_file_name = f'csv_ids_inex_{itinerario}_' + csv_filename
    # enviar_por_ftp(local_file_path, remote_file_name)


def obtener_csv_gsi(df_gsi, fecha):
    try:
        df = df_gsi[0][1]
    except TypeError as e:
        df = df_gsi[1]
    df = df[['Nombre campo', 'Cota comp.']]
    df = df[df['Cota comp.'] != '']
    df['FECHA'] = fecha
    df['FECHA'] = pd.to_datetime(df['FECHA']).dt.strftime('%d/%m/%Y %H:%M:%S')
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
