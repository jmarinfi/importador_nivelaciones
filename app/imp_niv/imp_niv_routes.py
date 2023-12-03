import json
import os
from flask import render_template, request, send_file, current_app

from app.imp_niv.modelo import ContrModelo

from . import imp_niv_bp

contr_modelo = ContrModelo()


@imp_niv_bp.route('/descargar-estadillos')
def descargar_estadillos():
    listas = contr_modelo.get_listas_json()
    return listas


@imp_niv_bp.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        data = request.get_json()
        return contr_modelo.set_noms_campo(data).get_reporte_json()
    return render_template('imp_niv/home.html')


@imp_niv_bp.route('/enviar-csv', methods=['POST'])
def enviar_csv():
    if request.method == 'POST':
        data = request.get_data()
        try:
            contr_modelo.set_csv(data).enviar_csv()
        except Exception as e:
            return str(e), 500
        return 'OK'
    

@imp_niv_bp.route('/get-sensors-lista/<int:id_lista>')
def get_sensors_lista(id_lista):
    sensores_lista = contr_modelo.get_sensors_lista_json(id_lista)
    print(sensores_lista)
    return sensores_lista
