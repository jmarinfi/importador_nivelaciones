from datetime import datetime
import os
from flask import current_app, render_template, request, send_file
from app.imp_niv.db_metrolima_controller import close_db_session, get_dict_id_externo_nom_sensor, get_lectura_inicial, get_tres_ultimas_lecturas, get_ultima_referencia

from app.imp_niv.models_py import ItinerarioReporte, LineReporte
from app.imp_niv.persistencia import enviar_ftp

from . import imp_niv_bp


@imp_niv_bp.route('/descargar-estadillos')
def descargar_estadillos():
    filepath = os.path.join('../files', 'Estadillos.xlsx')
    return send_file(filepath, as_attachment=True)


@imp_niv_bp.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        data = request.get_json()
        dict_id_externo = get_dict_id_externo_nom_sensor(data)
        if not dict_id_externo:
            return ItinerarioReporte(lineas_reporte=[]).model_dump()
        dict_ultimas_lecturas, dict_penultimas_lecturas, dict_antepenultimas_lecturas = get_tres_ultimas_lecturas(list(dict_id_externo.values()))
        dict_fecha_ultima_referencia, dict_lectura_ultima_referencia, dict_medida_ultima_referencia = get_ultima_referencia(list(dict_id_externo.values()))
        dict_fecha_inicial, dict_lectura_inicial, dict_medida_inicial = get_lectura_inicial(list(dict_id_externo.values()))
        close_db_session()

        dict_data = [LineReporte(
            nom_sensor=value,
            nom_campo=key,
            ult_lect=dict_ultimas_lecturas.get(value),
            penult_lect=dict_penultimas_lecturas.get(value),
            antepenult_lect=dict_antepenultimas_lecturas.get(value),
            fecha_ref=dict_fecha_ultima_referencia.get(value, dict_fecha_inicial.get(value)),
            lect_ref=dict_lectura_ultima_referencia.get(value, dict_lectura_inicial.get(value)),
            medida_ref=dict_medida_ultima_referencia.get(value, dict_medida_inicial.get(value)),
            medida=0.0,
            dif_ult_med=0.0,
            dif_penult_med=0.0,
            dif_antepenult_med=0.0
        ) for key, value in dict_id_externo.items()]
        
        return ItinerarioReporte(lineas_reporte=dict_data).model_dump()
    return render_template('imp_niv/home.html')


@imp_niv_bp.route('/enviar-csv', methods=['POST'])
def enviar_csv():
    if request.method == 'POST':
        data = request.get_data()
        try:
            enviar_ftp(data, f'{datetime.now().strftime("%Y%m%d%H%M%S")}.csv', current_app.config['FTP_SERVER_TD'], current_app.config['FTP_USER_TD'], current_app.config['FTP_PASS_TD'])
        except Exception as e:
            print(e)
            return str(e), 500
    return 'OK'
