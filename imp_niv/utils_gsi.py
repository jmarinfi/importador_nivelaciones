import math
import os
import re
import numpy as np
import pandas as pd
from werkzeug.exceptions import HTTPException


def abre_gsi(file):
    """
    Método que lee un archivo GSI y devuelve un dataframe con ese mismo contenido.
    :param: directorio (str): ubicación del archivo GSI
    :return: dataframe: datos del archivo ordenados en una tabla. Se añaden 2 columnas, una con el método
    de nivelación y otra con el número del itinerario.
    """
    # Define los separadores de columna y el patrón
    separadores = [" ", "...", "..", ".", "+"]
    patron_separadores = "|".join(re.escape(sep) for sep in separadores)
    # Lista para almacenar los datos de las filas
    tabla = []

    # Abre el GSI
    with open(file, 'r') as f:
        itinerario = 0
        metodo = None

        for line in f:
            # Elimina los espacios en blanco al inicio y al final de la línea
            line = line.strip()
            # Si la línea comienza con "505.", se omite
            if line.startswith("505."):
                continue
            # Comprueba si la línea contiene información del método e inicio de itinerario
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
            # Reemplaza los "-" por " -"
            line = line.replace("-", " -")
            # Divide la línea en columnas utilizando los separadores
            columns = [metodo, itinerario] + re.split(patron_separadores, line)
            # Añade la fila a los datos
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
    with open(file, 'r') as f:
        lineas = f.readlines()
        linea_actual = int(lineas[0][2:6])
        for line in lineas[1:-1]:
            if line.startswith("505."):
                linea_actual += 1
                continue
            linea_actual += 1
            if linea_actual < int(line[2:6]):
                lineas_faltantes.extend(
                    [f"{i:04}" for i in range(linea_actual, int(line[2:6]))]
                )
                linea_actual = int(line[2:6])
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
        '32': 'Dist. Hz. mira',
        '83': 'Cota',
        '331': 'Lect. espalda',
        '332': 'Lect. frente',
        '333': 'Lect. radiado',
        '390': 'Num. med. rep.',
        '391': 'Desv. est. media',
        '392': 'Disp. mediana',
        '573': 'Balance dist.',
        '574': 'Dist. total niv.'
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
    for nom_col in ["Dist. Hz. mira", "Cota", "Lect. espalda", "Lect. frente", "Lect. radiado", "Balance dist.",
                    "Dist. total niv."]:
        df_ordenado[nom_col] = pd.to_numeric(df_ordenado[nom_col])/100000

    # Elimina ceros a la izquierda de algunas columnas.
    for nom_col in ["Num. med. rep.", "Desv. est. media", "Disp. mediana"]:
        df_ordenado[nom_col] = df_ordenado[nom_col].str.lstrip("0")

    # Renombra las 3 primeras columnas.
    df_ordenado.rename(
        columns={0: "Metodo", 1: "Itinerario", 3: "Nombre campo"}, inplace=True)

    return df_ordenado


def get_error_cierre_niv(df_separado):
    """
    Calcula el error de cierre de cada uno de los itinerarios de nivelación de un dataframe.
    :param df_separado: Dataframe devuelto por "def separa_en_columnas(df_ordenado)".
    :return: Diccionario con los resultados.
    """
    # Calcula la diferencia entre la última y la primera cota por itinerario.
    result = df_separado.groupby('Itinerario')['Cota'].apply(
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
    result = df_separado.groupby('Itinerario')['Dist. total niv.'].last()

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
    # Calcular la columna 'Dist. acumulada'
    df_separado['Dist. acumulada'] = 0.0

    for index, row in df_separado.iterrows():
        if index > 0:
            if row['Itinerario'] == df_separado.at[index - 1, 'Itinerario']:
                if pd.isna(row['Lect. radiado']) and not pd.isna(row['Dist. Hz. mira']):
                    df_separado.at[index, 'Dist. acumulada'] = df_separado.at[index -
                                                                              1, 'Dist. acumulada'] + row['Dist. Hz. mira']
                else:
                    df_separado.at[index, 'Dist. acumulada'] = df_separado.at[index -
                                                                              1, 'Dist. acumulada']

    return df_separado


def add_cota_compensada_niv(df_dist_acum):
    """
    Añade una columna al dataframe con la cota compensada en función de la distancia recorrida.
    :param df_dist_acum: Dataframe devuelto por "def add_dist_parcial_niv(df_separdo)".
    :return: Dataframe con la nueva columna.
    """
    error_cierre = get_error_cierre_niv(df_dist_acum)
    dist_total = get_dist_tot_niv(df_dist_acum)
    df_dist_acum["Cota comp."] = df_dist_acum.apply(lambda row: row["Cota"] - (row["Dist. acumulada"] *
                                                                               (error_cierre.get(row["Itinerario"], 0) / 1000) /
                                                                               dist_total.get(row["Itinerario"], 1)), axis=1)
    return df_dist_acum


def procesar_gsi(file):
    df_gsi = abre_gsi(file)
    lineas_borradas = busca_lineas_borradas_gsi(file)
    if len(lineas_borradas) > 0:
        raise HTTPException(
            "Se han detectado líneas borradas: " + str(lineas_borradas))
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
                   for (itinerario, df_group) in df_gsi.groupby('Itinerario')]
    return df_gsi_list, error_de_cierre, distancia_total, error_km_posteriori, tolerancia
