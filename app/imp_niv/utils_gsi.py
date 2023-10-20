from datetime import datetime
import math
import re
from flask import flash
import numpy as np
import pandas as pd

from app.imp_niv.utils_db import get_dict_id_externo_nom_sensor, get_lectura_inicial, get_tres_ultimas_lecturas, get_ultima_referencia


def abre_gsi(file):
    """
    Método que lee un archivo GSI y devuelve un dataframe con ese mismo contenido.
    :param: directorio (str): ubicación del archivo GSI
    :return: dataframe: datos del archivo ordenados en una tabla. Se añaden 2 columnas, una con el método
    de nivelación y otra con el número del itinerario.
    """
    separadores = [" ", "...", "..", ".", "+"]
    patron_separadores = "|".join(re.escape(sep) for sep in separadores)

    tabla = []
    itinerario = 0
    metodo = None

    with open(file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if line.startswith("505."):
                continue

            line = line.strip()

            match = re.match(r"^41\d{4}\+\?*\.{5,6}(\d+)$", line)
            if match:
                metodo = {
                    "1": "EF",
                    "2": "EFFE",
                    "3": "aEF",
                    "4": "aEFFE",
                    "10": "Comprob_y_ajuste"
                }.get(match.group(1), None)
                itinerario += 1
                continue

            line = line.replace("-", " -")
            columns = [metodo, itinerario] + re.split(patron_separadores, line)
            tabla.append(columns)
    return pd.DataFrame(tabla)


def busca_lineas_borradas_gsi(file):
    """
    Método que devuelve una lista con los números de las líneas borradas de un archivo gsi.
    No funciona si se renombran todas las líneas del archivo posteriores a la línea borrada.

    :param: directorio (str): Ubicación del archivo GSI.
    :return: lineas_faltantes: Lista con los números de línea faltantes.
    """
    lineas_faltantes = []
    linea_actual = 0

    with open(file, 'r', encoding='utf-8', errors='ignore') as f:
        lineas = f.readlines()
        try:
            linea_actual = int(lineas[0][2:6])
        except:
            linea_actual = 1

        for linea in lineas:
            if linea.startswith("505."):
                linea_actual += 1
                continue

            linea_actual += 1
            if linea_actual < int(linea[2:6]):
                lineas_faltantes.extend(
                    [f"{i:04}" for i in range(linea_actual, int(linea[2:6]))]
                )
                linea_actual = int(linea[2:6])
    return lineas_faltantes


def ordena_df_gsi(df_archivo):
    """
    Elimina datos innecesarios del df extraído del gsi. Separa la información en nuevas columnas.
    Nombra las columnas nuevas y viejas. No realiza cálculos.
    :param df_archivo: Dataframe obtenido al abrir el archivo gsi.
    :return: Dataframe con la información parcialmente ordenada, preparada para ser separada en columnas.
    """
    # Elimina los ceros de la columna 3 que contiene los nombres de puntos
    df_archivo[3] = df_archivo[3].apply(lambda x: x.lstrip("0"))
    # Elimina filas innecesarias del dataframe:
    df_archivo = df_archivo.drop(df_archivo.columns[[2, 5, 8, 11, 14]], axis=1)

    return df_archivo


def separa_en_columnas(df_ordenado):
    """
    Separa en columnas los datos desordenados del dataframe. En cada columna queda solamente un tipo de valor.
    Borra las columnas innecesarias. Modifica los nombres de las columnas.
    :param df_ordenado: Dataframe ordenado mediante el método ordena_df_gsi().
    :return: Dataframe con toda la información completamente ordenada y legible, con nombres de columnas.
    """
    # Define el diccionario de sustituciones
    sustituciones = {
        '32': 'DIST_MIRA',
        '83': 'COTA',
        '331': 'ESPALDA',
        '332': 'FRENTE',
        '333': 'RADIADO',
        '390': 'MED_REP',
        '391': 'DESV_EST',
        '392': 'MEDIANA',
        '573': 'BALANCE',
        '574': 'DIST_TOTAL'
        # TODO 507 y 508 averiguar.
    }

    # Aplica las sustituciones a cada columna
    for col in [4, 7, 10, 13]:
        df_ordenado[col].replace(sustituciones, inplace=True)

    # Crea las nuevas columnas definidas en el diccionario "sustituciones".
    for col_name in sustituciones.values():
        df_ordenado[col_name] = np.where(
            df_ordenado[4] == col_name, df_ordenado[6], None)
        for nom_col in [7, 10, 13]:
            df_ordenado[col_name] = np.where(pd.isnull(df_ordenado[col_name]) & (df_ordenado[nom_col] == col_name),
                                             df_ordenado[nom_col + 2], df_ordenado[col_name])
    # Elimina columnas no utilizadas
    df_ordenado = df_ordenado.drop(
        df_ordenado.columns[[3, 4, 5, 6, 7, 8, 9, 10]], axis=1)

    # Multiplica los valores de algunas columnas para pasar a metros.
    for nom_col in ["DIST_MIRA", "COTA", "ESPALDA", "FRENTE", "RADIADO", "BALANCE",
                    "DIST_TOTAL"]:
        df_ordenado[nom_col] = pd.to_numeric(df_ordenado[nom_col])/100000

    # Elimina ceros a la izquierda de algunas columnas.
    for nom_col in ["MED_REP", "DESV_EST", "MEDIANA"]:
        df_ordenado[nom_col] = df_ordenado[nom_col].str.lstrip("0")

    # Renombra las 3 primeras columnas.
    df_ordenado.rename(
        columns={0: "METODO", 1: "ITINERARIO", 3: "NOM_CAMPO"}, inplace=True)

    return df_ordenado


def get_error_cierre_niv(df_separado):
    """
    Calcula el error de cierre de cada uno de los itinerarios de nivelación de un dataframe.
    :param df_separado: Dataframe devuelto por "def separa_en_columnas(df_ordenado)".
    :return: Diccionario con los resultados.
    """
    # Calcula la diferencia entre la última y la primera COTA por itinerario.
    result = df_separado.groupby('ITINERARIO')['COTA'].apply(
        lambda x: (x.iloc[-1] - x.iloc[0])*1000)

    # Convierte el resultado en un diccionario
    return result.to_dict()


def get_dist_tot_niv(df_separado):
    """
    Extrae de cada itinerario de un dataframe, la distancia de nivelación.
    :param df_separado: Dataframe devuelto por "def separa_en_columnas(df_ordenado)".
    :return: Diccionario con los resultados.
    """
    # Halla el último valor de distancia para cada itinerario.
    result = df_separado.groupby('ITINERARIO')['DIST_TOTAL'].last()

    # Convierte el resultado en un diccionario
    return result.to_dict()


def get_error_km_posteriori(df_separado):
    """
    Calcula de cada itinerario de nivelación de un dataframe, el error kilométrico a posteriori.
    :param df_separado: Dataframe devuelto por "def separa_en_columnas(df_ordenado)".
    :return: Diccionario con los resultados.
    """
    return {key: math.fabs(get_error_cierre_niv(df_separado)[key]) /
            math.sqrt(get_dist_tot_niv(df_separado)[key] / 1000) for key in get_error_cierre_niv(df_separado)}


def get_tolerancia_niv(df_separado, errorKmPriori):
    """
    Calcula de cada itinerario de nivelación de un dataframe, la tolerancia para un error kilométrico dado.
    :param df_separado: Dataframe devuelto por "def separa_en_columnas(df_ordenado)".
    :param errorKmPriori: Error kilométrico a priori en milímetros. El error máximo que permite el cliente.
    :return: Diccionario con los resultados.
    """
    return {key: errorKmPriori * math.sqrt(value / 1000) for key, value in get_dist_tot_niv(df_separado).items()}


def add_dist_parcial_niv(df_separado):
    """
    Añade una columna al dataframe con la distancia acumulada de la nivelación.
    :param df_separdo: Dataframe devuelto por "def separa_en_columnas(df_ordenado)".
    :return: Dataframe con la nueva columna.
    """
    # Calcular la columna 'DIST_ACUM'
    df_separado['DIST_ACUM'] = 0.0

    for index, row in df_separado.iterrows():
        if index > 0:
            if row['ITINERARIO'] == df_separado.at[index - 1, 'ITINERARIO']:
                if pd.isna(row['RADIADO']) and not pd.isna(row['DIST_MIRA']):
                    df_separado.at[index, 'DIST_ACUM'] = df_separado.at[index -
                                                                              1, 'DIST_ACUM'] + row['DIST_MIRA']
                else:
                    df_separado.at[index, 'DIST_ACUM'] = df_separado.at[index -
                                                                              1, 'DIST_ACUM']

    return df_separado


def add_cota_compensada_niv(df_dist_acum):
    """
    Añade una columna al dataframe con la cota compensada en función de la distancia recorrida.
    :param df_dist_acum: Dataframe devuelto por "def add_dist_parcial_niv(df_separdo)".
    :return: Dataframe con la nueva columna.
    """
    error_cierre = get_error_cierre_niv(df_dist_acum)
    dist_total = get_dist_tot_niv(df_dist_acum)
    df_dist_acum["COTA_COMP"] = df_dist_acum.apply(lambda row: row["COTA"] - (row["DIST_ACUM"] *
                                                                               (error_cierre.get(row["ITINERARIO"], 0) / 1000) /
                                                                               dist_total.get(row["ITINERARIO"], 1)), axis=1)
    return df_dist_acum


def procesar_gsi(file):
    df_gsi = abre_gsi(file)
    lineas_borradas = busca_lineas_borradas_gsi(file)
    if len(lineas_borradas) > 0:
        flash("Se han detectado líneas borradas: " + str(lineas_borradas))
    df_gsi = ordena_df_gsi(df_gsi)
    df_gsi = separa_en_columnas(df_gsi)
    error_de_cierre = get_error_cierre_niv(df_gsi)
    distancia_total = get_dist_tot_niv(df_gsi)
    error_km_posteriori = get_error_km_posteriori(df_gsi)
    tolerancia = get_tolerancia_niv(df_gsi, 0.3)
    df_gsi = add_dist_parcial_niv(df_gsi)
    df_gsi = add_cota_compensada_niv(df_gsi)
    df_gsi = df_gsi.replace(np.nan, '', regex=True)
    df_gsi_list = [(itinerario, df_group)
                   for (itinerario, df_group) in df_gsi.groupby('ITINERARIO')]
    return df_gsi_list, error_de_cierre, distancia_total, error_km_posteriori, tolerancia


def get_report_from_gsi(data: dict) -> tuple:
    tableData = data.get('tableData')
    fecha = data.get('datetime')

    # Crea un dataframe con los datos del itinerario
    df = pd.DataFrame(tableData)
    
    # Filtra y reordena las columnas del DataFrame
    df = df[['NOM_CAMPO', 'COTA_COMP']]
    df = df[df['COTA_COMP'] != '']
    df['FECHA'] = pd.to_datetime(fecha).strftime('%d/%m/%Y %H:%M:%S')
    df = df[['FECHA', 'NOM_CAMPO', 'COTA_COMP']]

    # Mapea los nombres de campo a sus respectivos sensores
    dict_nom_sensor = get_dict_id_externo_nom_sensor(list(df['NOM_CAMPO']))
    df['NOM_SENSOR'] = df['NOM_CAMPO'].map(dict_nom_sensor)
    df = df[['FECHA', 'NOM_CAMPO', 'NOM_SENSOR', 'COTA_COMP']]

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
        df_ids_existentes['MEDIDA'] = (df_ids_existentes['COTA_COMP'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float)
        df_ids_existentes['DIF_ULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - ((df_ids_existentes['ULT_LECT'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float))
        df_ids_existentes['DIF_PENULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - ((df_ids_existentes['PENULT_LECT'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float))
        df_ids_existentes['DIF_ANTEPENULT_MEDIDA'] = df_ids_existentes['MEDIDA'] - ((df_ids_existentes['ANTEPENULT_LECT'].astype(
            float) - df_ids_existentes['LECTURA_REF'].astype(float)) * 1000 + df_ids_existentes['MEDIDA_REF'].astype(float))

    return (df_ids_existentes, df_ids_inexistentes)
