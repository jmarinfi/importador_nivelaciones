import re
import pandas as pd


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
