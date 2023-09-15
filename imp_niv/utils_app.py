import os
from flask import current_app, session
import pandas as pd

import json


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
