from ftplib import FTP
import os
import re
from flask import current_app, session
import pandas as pd

import json

from .utils_db import get_dict_id_externo_nom_sensor, get_lectura_inicial, get_tres_ultimas_lecturas, get_ultima_referencia


def deserializar_df_gsi(path):
    """Deserializa un archivo json con una lista de dataframes de pandas y lo devuelve como una lista de dataframes de pandas"""

    with open(path, 'r') as file:
        lista_serializada = json.load(file)
        df_gsi = [(itinerario[0], pd.DataFrame(json.loads(itinerario[1])))
                  for itinerario in lista_serializada]
    return df_gsi


def deserializar_csv_gsi_list(path):
    """Deserializa un archivo json con una lista de dataframes de pandas y lo devuelve como una lista de dataframes de pandas"""

    with open(path, 'r') as file:
        lista_serializada = json.load(file)
        csv_gsi = [(itinerario[0], pd.DataFrame(json.loads(itinerario[1])), pd.DataFrame(json.loads(itinerario[2])))
                   for itinerario in lista_serializada]

    return csv_gsi


def deserializar_csv_gsi(path):
    """Deserializa un archivo json con un dataframe de pandas y lo devuelve como un dataframe de pandas"""

    with open(path, 'r') as file:
        return pd.DataFrame(json.loads(file.read()))


def serializar_df_gsi(df_gsi):
    """Serializa una lista de dataframes de pandas y lo devuelve como un archivo json"""

    lista_serializada = [(itinerario[0], itinerario[1].to_json())
                         for itinerario in df_gsi]
    lista_serializada_json = json.dumps(lista_serializada)
    json_filename = re.sub(r'\.gsi', '.json', session.get(
        'df_gsi_filename'), flags=re.IGNORECASE)
    lista_serializada_json_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], 'processed_' + json_filename)
    session['df_gsi_path'] = lista_serializada_json_path
    with open(lista_serializada_json_path, 'w') as outfile:
        outfile.write(lista_serializada_json)


def serializar_csv_gsi(csv_gsi, itinerario):
    """Serializa un dataframe de pandas y lo devuelve como un archivo json"""

    df_serializado = csv_gsi.to_json()
    json_filename = re.sub(r'\.gsi', '.json', session.get(
        'df_gsi_filename'), flags=re.IGNORECASE)
    df_serializado_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], f'csv_gsi_{itinerario}_' + json_filename)
    session['csv_gsi_path'] = df_serializado_path
    with open(df_serializado_path, 'w') as outfile:
        outfile.write(df_serializado)


def serializar_csv_gsi_list(csv_gsi_list):
    """Serializa una lista de dataframes de pandas y lo devuelve como un archivo json"""

    lista_serializada = [(itinerario[0], itinerario[1].to_json(), itinerario[2].to_json())
                         for itinerario in csv_gsi_list]
    lista_serializada_json = json.dumps(lista_serializada)
    json_filename = re.sub(r'\.gsi', '.json', session.get(
        'df_gsi_filename'), flags=re.IGNORECASE)
    lista_serializada_json_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], 'csv_gsi_list_' + json_filename)
    session['csv_gsi_list_path'] = lista_serializada_json_path
    with open(lista_serializada_json_path, 'w') as outfile:
        outfile.write(lista_serializada_json)


def enviar_por_ftp(local_file_path, remote_file_name):
    """Envía un archivo por ftp a un servidor"""

    with FTP(host=current_app.config['FTP_SERVER_TD'], user=current_app.config['FTP_USER_TD'], passwd=current_app.config['FTP_PASS_TD']) as ftp:
        with open(local_file_path, 'rb') as text_file:
            ftp.cwd('/LIMA/Linea_2')
            ftp.storlines('STOR ' + remote_file_name, text_file)


def enviar_csv(df, itinerario):
    """Transforma un dataframe a csv y lo envía por ftp a un servidor"""

    filename = session.get('df_gsi_filename')
    csv_filename = re.sub(r'\.gsi', '.csv',
                          filename, flags=re.IGNORECASE)
    csv_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], f'csv_{itinerario}_' + csv_filename)
    df.to_csv(csv_path, sep=';', header=False, index=False)

    local_file_path = csv_path
    remote_file_name = f'csv_{itinerario}_' + csv_filename
    enviar_por_ftp(local_file_path, remote_file_name)


def enviar_csv_ids_inex(df, itinerario):
    """Transforma un dataframe a csv y lo envía por ftp a un servidor"""

    filename = session.get('df_gsi_filename')
    csv_filename = re.sub(r'\.gsi', '.csv',
                          filename, flags=re.IGNORECASE)
    csv_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], f'csv_ids_inex_{itinerario}_' + csv_filename)
    df.to_csv(csv_path, sep=';', header=False, index=False)

    local_file_path = csv_path
    remote_file_name = f'csv_ids_inex_{itinerario}_' + csv_filename
    enviar_por_ftp(local_file_path, remote_file_name)


def obtener_csv_gsi(df_gsi, fecha):
    """Obtiene un dataframe de pandas con los datos de los sensores de un itinerario de un archivo gsi"""

    # Intenta obtener el Dataframe de df_gsi[0][1] si no lo obtiene obtiene el Dataframe de df_gsi[1]
    try:
        df = df_gsi[0][1]
    except TypeError as e:
        df = df_gsi[1]

    # Filtra y reordena las columnas del Dataframe
    df = df[['Nombre campo', 'Cota comp.']]
    df = df[df['Cota comp.'] != '']
    df['FECHA'] = pd.to_datetime(fecha).strftime('%d/%m/%Y %H:%M:%S')
    df = df[['FECHA', 'Nombre campo', 'Cota comp.']]

    # Mapea los nombres de campo a sus respectivos sensores
    dict_nom_sensor = get_dict_id_externo_nom_sensor(list(df['Nombre campo']))
    df['NOM_SENSOR'] = df['Nombre campo'].map(dict_nom_sensor)
    df = df[['FECHA', 'Nombre campo', 'NOM_SENSOR', 'Cota comp.']]

    # Divide el DataFrame en existentes y no existentes basado en 'NOM_SENSOR'
    df_ids_inexistentes = df[df['NOM_SENSOR'].isnull()].copy()
    df_ids_existentes = df[df['NOM_SENSOR'].notnull()].copy()

    # Si existen sensores en el DataFrame
    if not df_ids_existentes.empty:
        nom_sensor_list = list(df_ids_existentes['NOM_SENSOR'])
        dict_ultimas_lecturas, dict_penultimas_lecturas, dict_antepenultimas_lecturas = get_tres_ultimas_lecturas(
            nom_sensor_list)
        dict_fecha_ultima_referencia, dict_lectura_ultima_referencia, dict_medida_ultima_referencia = get_ultima_referencia(
            nom_sensor_list)
        dict_fecha_inicial, dict_lectura_inicial, dict_medida_inicial = get_lectura_inicial(
            nom_sensor_list)

        # Funciones para reemplazar valores basados en condiciones
        def replace_fecha_based_on_condition(row):
            return dict_fecha_inicial.get(row['NOM_SENSOR'], None) if pd.isna(row['FECHA']) else row['FECHA']

        def replace_lectura_based_on_condition(row):
            return dict_lectura_inicial.get(row['NOM_SENSOR'], None) if pd.isna(row['LECTURA_REF']) else row['LECTURA_REF']

        def replace_medida_based_on_condition(row):
            return dict_medida_inicial.get(row['NOM_SENSOR'], None) if pd.isna(row['MEDIDA_REF']) else row['MEDIDA_REF']

        # Aplicar mapeos y funciones de reemplazo
        df_ids_existentes = df_ids_existentes.assign(
            ULT_LECT=df_ids_existentes['NOM_SENSOR'].map(
                dict_ultimas_lecturas),
            PENULT_LECT=df_ids_existentes['NOM_SENSOR'].map(
                dict_penultimas_lecturas),
            ANTEPENULT_LECT=df_ids_existentes['NOM_SENSOR'].map(
                dict_antepenultimas_lecturas),
            FECHA_REF=df_ids_existentes['NOM_SENSOR'].map(
                dict_fecha_ultima_referencia),
            LECTURA_REF=df_ids_existentes['NOM_SENSOR'].map(
                dict_lectura_ultima_referencia),
            MEDIDA_REF=df_ids_existentes['NOM_SENSOR'].map(
                dict_medida_ultima_referencia)
        )

        # Reemplaza valores basados en condiciones
        df_ids_existentes['FECHA_REF'] = df_ids_existentes.apply(
            replace_fecha_based_on_condition, axis=1)
        df_ids_existentes['LECTURA_REF'] = df_ids_existentes.apply(
            replace_lectura_based_on_condition, axis=1)
        df_ids_existentes['MEDIDA_REF'] = df_ids_existentes.apply(
            replace_medida_based_on_condition, axis=1)

        # Calcula medidas y diferencias
        df_ids_existentes['MEDIDA'] = (df_ids_existentes['Cota comp.'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float)
        df_ids_existentes['DIF_ULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - ((df_ids_existentes['ULT_LECT'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float))
        df_ids_existentes['DIF_PENULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - ((df_ids_existentes['PENULT_LECT'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float))
        df_ids_existentes['DIF_ANTEPENULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - ((df_ids_existentes['ANTEPENULT_LECT'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float))

    return df_ids_existentes, df_ids_inexistentes


def init_cleanup(app):
    """Elimina todos los archivos temporales JSON, si existen, que se hayan serializado en alguna sesión anterior."""
    files = os.listdir(app.config['UPLOAD_FOLDER'])

    for file in files:
        if file.endswith('.json'):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file)
            try:
                os.remove(file_path)
            except:
                pass
