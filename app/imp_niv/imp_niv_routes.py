from datetime import datetime
from io import BytesIO
import json
from flask import current_app, flash, session
import os
from flask import render_template, request, send_file
import pandas as pd

from app.imp_niv.imp_niv_controller import add_to_session, save_file
from app.imp_niv.imp_niv_persistencia import enviar_ftp, serializar_dataframe, serializar_lista_dataframes
from app.imp_niv.utils_gsi import get_report_from_gsi, procesar_gsi

from . import imp_niv_bp


@imp_niv_bp.route('/descargar-estadillos')
def descargar_estadillos():
    filepath = os.path.join('../files', 'Estadillos.xlsx')
    return send_file(filepath, as_attachment=True)


@imp_niv_bp.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        file = request.files['formFile']
        
        # Procesar el archivo y renderizar la plantilla correspondiente
        gsi_path = save_file(file, current_app.config['UPLOAD_FOLDER'])
        try:
            # Procesa el archivo GSI y guarda los parámetros en la sesión
            df_gsi, error_de_cierre, distancia_total, error_km_posteriori, tolerancia = procesar_gsi(gsi_path)
            add_to_session(session, {
                'ERROR_DE_CIERRE': error_de_cierre,
                'DISTANCIA_TOTAL': distancia_total,
                'ERROR_KM_POSTERIORI': error_km_posteriori,
                'TOLERANCIA': tolerancia
            })
            os.remove(gsi_path)

            # TODO: renderizar datos
            return render_template('imp_niv/home.html', 
                            error_de_cierre=json.dumps(error_de_cierre), 
                            distancia_total=json.dumps(distancia_total), 
                            error_km_posteriori=json.dumps(error_km_posteriori), 
                            tolerancia=json.dumps(tolerancia),
                            tables=serializar_lista_dataframes(df_gsi))
        
        except Exception as e:
            return render_template('imp_niv/500_generic.html', e=e), 500
        
    return render_template('imp_niv/home.html')


@imp_niv_bp.route('/procesar', methods=['POST'])
def procesar():
    keys_request = request.form.keys()
    if 'accept' in keys_request:
        # Procesar un itinerario
        data_str = request.form.get('accept')
        data = json.loads(data_str)
        
        df_existentes, df_inexistentes = get_report_from_gsi(data)
        report = {
            'itinerario': data.get('itinerario'),
            'existentes': serializar_dataframe(df_existentes),
            'inexistentes': serializar_dataframe(df_inexistentes)
        }
        
        return render_template('imp_niv/procesar.html', data=[report])
    
    # Procesar todos los itinerarios
    data_str = request.form.get('accept-all')
    data_dict = json.loads(data_str)
    fecha = data_dict.get('datetime')
    tables = data_dict.get('tableData')
    report = []

    for table in tables:
        itinerario = table[0]
        data_str_table = table[1]
        data_table = json.loads(data_str_table)
        data = {
            'itinerario': itinerario,
            'tableData': data_table,
            'datetime': fecha
        }
        df_existentes, df_inexistentes = get_report_from_gsi(data)
        report.append({
            'itinerario': itinerario,
            'existentes': serializar_dataframe(df_existentes),
            'inexistentes': serializar_dataframe(df_inexistentes)
        })
    
    return render_template('imp_niv/procesar.html', data=report)


@imp_niv_bp.route('/enviar', methods=['POST'])
def enviar():
    keys_request = request.form.keys()
    if 'accept' in keys_request:
        # Procesar un itinerario
        data_str = request.form.get('accept')
        data_dict = json.loads(data_str)
        data_df = pd.DataFrame(data_dict.get('data'))
        data_df = data_df[['FECHA', 'NOM_SENSOR', 'COTA_COMP']]
        data_csv = data_df.to_csv(sep=';', header=False, index=False)
        try:
            enviar_ftp(data_csv, f'{datetime.now().strftime("%Y%m%d%H%M%S")}_itinerario{data_dict.get("itinerario")}.csv', current_app.config['FTP_SERVER_TD'], current_app.config['FTP_USER_TD'], current_app.config['FTP_PASS_TD'])
        except Exception as e:
            flash(f'Error al enviar por FTP: {e}\nSe descarga el archivo para su exportación manual.', 'danger')
            csv_bites = BytesIO(data_csv.encode('utf-8'))
            return send_file(csv_bites, as_attachment=True, attachment_filename=f'{datetime.now().strftime("%Y%m%d%H%M%S")}_itinerario{data_dict.get("itinerario")}.csv', mimetype='text/csv')
        data = {
            'itinerario': data_dict.get('itinerario'),
            'csv': data_csv
        }

        return render_template('imp_niv/enviar.html', data=[data])
    
    # Procesar todos los itinerarios
    data_str = request.form.get('accept-all')
    data_dict = json.loads(data_str)
    data_tables = data_dict.get('data')
    data = []
    for itinerario in data_tables:
        data_str = itinerario.get('existentes')
        data_dict = json.loads(data_str)
        data_df = pd.DataFrame(data_dict)
        data_df = data_df[['FECHA', 'NOM_SENSOR', 'COTA_COMP']]
        data_csv = data_df.to_csv(sep=';', header=False, index=False)
        try:
            enviar_ftp(data_csv, f'{datetime.now().strftime("%Y%m%d%H%M%S")}_itinerario{itinerario.get("itinerario")}.csv', current_app.config['FTP_SERVER_TD'], current_app.config['FTP_USER_TD'], current_app.config['FTP_PASS_TD'])
        except Exception as e:
            flash(f'Error al enviar por FTP: {e}\nSe descarga el archivo para su exportación manual.', 'danger')
            csv_bites = BytesIO(data_csv.encode('utf-8'))
            return send_file(csv_bites, as_attachment=True, attachment_filename=f'{datetime.now().strftime("%Y%m%d%H%M%S")}_itinerario{itinerario.get("itinerario")}.csv', mimetype='text/csv')
        data.append({
            'itinerario': itinerario.get('itinerario'),
            'csv': data_csv
        })

    return render_template('imp_niv/enviar.html', data=data)

