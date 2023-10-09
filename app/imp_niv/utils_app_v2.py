from ftplib import FTP
import json
import os
import pandas as pd

from app.imp_niv.utils_db import get_dict_id_externo_nom_sensor, get_lectura_inicial, get_tres_ultimas_lecturas, get_ultima_referencia


def serializar_dataframe(df: pd.DataFrame) -> str:
    """Serializa un dataframe de pandas y lo devuelve como un archivo json"""

    return df.to_json()


def serializar_lista_dataframes(lista_dataframes: list) -> str:
    """Serializa una lista de dataframes de pandas y lo devuelve como un archivo json"""

    lista_serializada = [(itinerario[0], serializar_dataframe(itinerario[1])) for itinerario in lista_dataframes]
    return json.dumps(lista_serializada)


def guardar_serializacion_json(serializacion: str, path: str) -> None:
    """Guarda una serialización en formato json en un archivo"""

    with open(path, 'w') as outfile:
        outfile.write(serializacion)


def cargar_serializacion_json(path: str) -> str:
    """Carga una serialización en formato json desde un archivo"""

    with open(path, 'r') as file:
        return file.read()
    
def deserializar_dataframe(serializacion: str) -> pd.DataFrame:
    """Deserializa un archivo json con un dataframe de pandas y lo devuelve como un dataframe de pandas"""

    return pd.DataFrame(json.loads(serializacion))

def deserialize_lista_dataframes(serializacion: str) -> list:
    """Deserializa un archivo json con una lista de dataframes de pandas y lo devuelve como una lista de dataframes de pandas"""

    return [(itinerario[0], deserializar_dataframe(itinerario[1])) for itinerario in json.loads(serializacion)]


def enviar_ftp(local_path: str, remote_path: str, host: str, user: str, password: str) -> None:
    """Envía un archivo a un servidor ftp"""

    with FTP(host=host, user=user, passwd=password) as ftp:
        with open(local_path, 'rb') as file:
            ftp.storbinary(f'STOR {remote_path}', file)


def get_path(relative_path: str, filename: str) -> str:
    """Devuelve la ruta absoluta de un archivo"""

    return os.path.join(os.path.abspath(relative_path), filename)


def get_reporte_from_df(df: pd.DataFrame, fecha: str) -> pd.DataFrame:
    """Devuelve un dataframe con el reporte de un itinerario"""

    # Filtra y reordena las columnas del DataFrame
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
            nom_sensor_list
        )
        dict_fecha_ultima_referencia, dict_lectura_ultima_referencia, dict_medida_ultima_referencia = get_ultima_referencia(
            nom_sensor_list
        )
        dict_fecha_inicial, dict_lectura_inicial, dict_medida_inicial = get_lectura_inicial(
            nom_sensor_list
        )

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
                dict_ultimas_lecturas
            ),
            PENULT_LECT=df_ids_existentes['NOM_SENSOR'].map(
                dict_penultimas_lecturas
            ),
            ANTEPENULT_LECT=df_ids_existentes['NOM_SENSOR'].map(
                dict_antepenultimas_lecturas
            ),
            FECHA_REF=df_ids_existentes['NOM_SENSOR'].map(
                dict_fecha_ultima_referencia
            ),
            LECTURA_REF=df_ids_existentes['NOM_SENSOR'].map(
                dict_lectura_ultima_referencia
            ),
            MEDIDA_REF=df_ids_existentes['NOM_SENSOR'].map(
                dict_medida_ultima_referencia
            )
        )

        # Reemplaza valores basados en condiciones
        df_ids_existentes['FECHA_REF'] = df_ids_existentes.apply(
            replace_fecha_based_on_condition, axis=1
        )
        df_ids_existentes['LECTURA_REF'] = df_ids_existentes.apply(
            replace_lectura_based_on_condition, axis=1
        )
        df_ids_existentes['MEDIDA_REF'] = df_ids_existentes.apply(
            replace_medida_based_on_condition, axis=1
        )

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


def get_reporte_from_df_list(df_list: list, fecha: str) -> list:
    """Devuelve una lista de dataframes con los reportes de una lista de itinerarios"""

    return [(itinerario[0], get_reporte_from_df(itinerario[1], fecha)) for itinerario in df_list]
