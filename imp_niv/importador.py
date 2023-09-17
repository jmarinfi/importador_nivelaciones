import os
from flask import (
    Blueprint, current_app, flash, redirect, render_template, request, session, url_for, send_file
)
from werkzeug.utils import secure_filename
from imp_niv.utils_app import deserializar_csv_gsi, deserializar_csv_gsi_list, deserializar_df_gsi, enviar_csv, enviar_csv_ids_inex, obtener_csv_gsi, serializar_csv_gsi, serializar_csv_gsi_list, serializar_df_gsi
from imp_niv.utils_gsi import procesar_gsi


ALLOWED_EXTENSIONS = {'gsi', }

bp = Blueprint('importador', __name__)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('/', methods=('GET', 'POST'))
def home():
    if request.method == 'POST':
        # Código que se ejecuta en caso que la llamada al endpoint provenga del formulario del inicio
        if 'formFile' not in request.files:
            # En caso que no se haya seleccionado ningún GSI, se muestra un aviso
            flash('No hay archivo', category='error')
            return redirect(request.url)
        # Se recupera el GSI del request
        file = request.files['formFile']
        if file.filename == '':
            # En caso que se haya seleccionado un archivo vacío, se muestra un aviso
            flash('No hay ningún archivo seleccionado', category='error')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            # En caso que el archivo contenga una extensión que sea "gsi" o "GSI", se almacena en disco, se procesa y se muestra en la página de inicio
            session['df_gsi_filename'] = secure_filename(file.filename)
            file_path = os.path.join(
                current_app.config['UPLOAD_FOLDER'], session.get('df_gsi_filename'))
            file.save(file_path)
            # Se procesa el GSI, capturando las posibles excepciones que puedan ocurrir
            try:
                df_gsi, error_de_cierre, distancia_total, error_km_posteriori, tolerancia = procesar_gsi(
                    file_path)
                session['error_de_cierre'] = error_de_cierre
                session['distancia_total'] = distancia_total
                session['error_km_posteriori'] = error_km_posteriori
                session['tolerancia'] = tolerancia
                serializar_df_gsi(df_gsi)
            except Exception as e:
                return render_template('500_generic.html', e=e), 500
            return render_template(
                'home.html', tables=df_gsi,
                error_de_cierre=error_de_cierre,
                distancia_total=distancia_total,
                error_km_posteriori=error_km_posteriori,
                tolerancia=tolerancia
            )
        flash('Archivo no válido. Sólo se admiten archivos gsi', category='error')
    return render_template('home.html')


@bp.route('/descargar-estadillos')
def descargar_estadillos():
    filepath = os.path.join('../files', 'Estadillos.xlsx')
    return send_file(filepath, as_attachment=True)


@bp.route('/procesar', methods=['POST'])
def procesar():
    if request.form.get('rechazar'):
        itinerario_rechazado_str = request.form.get('rechazar')
        itinerario_rechazado_int = int(itinerario_rechazado_str)
        df_gsi = deserializar_df_gsi(session.get('df_gsi_path'))
        df_gsi = [(itinerario[0], itinerario[1])
                  for itinerario in df_gsi if itinerario[0] != itinerario_rechazado_int]
        session['error_de_cierre'] = {int(k): v for k, v in session.get(
            'error_de_cierre').items() if k != itinerario_rechazado_str}
        session['distancia_total'] = {int(k): v for k, v in session.get(
            'distancia_total').items() if k != itinerario_rechazado_str}
        session['error_km_posteriori'] = {int(k): v for k, v in session.get(
            'error_km_posteriori').items() if k != itinerario_rechazado_str}
        session['tolerancia'] = {int(k): v for k, v in session.get(
            'tolerancia').items() if k != itinerario_rechazado_str}
        serializar_df_gsi(df_gsi)
        return render_template('home.html', tables=df_gsi,
                               error_de_cierre=session.get('error_de_cierre'),
                               distancia_total=session.get('distancia_total'),
                               error_km_posteriori=session.get(
                                   'error_km_posteriori'),
                               tolerancia=session.get('tolerancia'))
    if request.form.get('aceptar') or request.form.get('fechaInput'):
        if not request.form.get('fechaInput'):
            session['itinerario_aceptado_str'] = request.form.get('aceptar')
            session['itinerario_aceptado_int'] = int(
                session.get('itinerario_aceptado_str'))
            return render_template('procesar.html')
        if request.form.get('fechaInput'):
            df_gsi = deserializar_df_gsi(session.get('df_gsi_path'))
            fecha = request.form.get('fechaInput')
            itinerario_aceptado = session.get('itinerario_aceptado_str')
            if itinerario_aceptado != 'todos':
                df_gsi = [(itinerario[0], itinerario[1])
                          for itinerario in df_gsi if itinerario[0] == session.get('itinerario_aceptado_int')]
                csv_gsi, ids_inexistentes = obtener_csv_gsi(df_gsi, fecha)
                serializar_csv_gsi(csv_gsi, itinerario_aceptado)
                try:
                    enviar_csv_ids_inex(ids_inexistentes, itinerario_aceptado)
                except Exception as e:
                    flash(
                        'No se ha podido enviar el CSV de ids inexistentes por FTP, pero hay una copia en el servidor', category='error')
                return render_template('procesar.html', csv_gsi=csv_gsi, ids_inexistentes=ids_inexistentes)
            else:
                csv_gsi_list = []
                for itinerario in df_gsi:
                    csv_gsi, ids_inexistentes = obtener_csv_gsi(
                        itinerario, fecha)
                    csv_gsi_list.append(
                        (itinerario[0], csv_gsi, ids_inexistentes))
                    serializar_csv_gsi_list(csv_gsi_list)
                    try:
                        enviar_csv_ids_inex(ids_inexistentes, itinerario[0])
                    except Exception as e:
                        flash(
                            'No se ha podido enviar el CSV de ids inexistentes por FTP, pero hay una copia en el servidor', category='error')
                return render_template('procesar.html', csv_gsi_list=csv_gsi_list)
    if request.form.get('aceptar-todos'):
        session['itinerario_aceptado_str'] = 'todos'
        session['itinerario_aceptado_int'] = 0
        return render_template('procesar.html')
    return redirect(url_for('importador.home'))


@bp.route('/enviar', methods=['POST'])
def enviar():
    if request.form.get('aceptar'):
        itinerario_aceptado = int(request.form.get('aceptar'))
        csv_gsi = deserializar_csv_gsi(session.get('csv_gsi_path'))
        csv_gsi = csv_gsi[['FECHA', 'NOM_SENSOR', 'Cota comp.']]
        try:
            enviar_csv(csv_gsi, itinerario_aceptado)
        except Exception as e:
            return render_template(
                '500_generic.html',
                e=e,
                message='No se ha podido enviar el archivo. Vuelve a intentarlo o descarga el CSV e impórtalo manualmente'
            )
        return render_template('enviar.html', csv=csv_gsi)

    if request.form.get('aceptar-todos'):
        csv_gsi_list = deserializar_csv_gsi_list(
            session.get('csv_gsi_list_path'))
        print(csv_gsi_list)
        csv_list = [(itinerario[0], itinerario[1][['FECHA', 'NOM_SENSOR', 'Cota comp.']])
                    for itinerario in csv_gsi_list]
        for csv in csv_list:
            enviar_csv(csv[1], csv[0])
        print(csv_list)
        return render_template('enviar.html', csv_list=csv_list)

    flash('El reporte rechazado no se ha importado', category='warning')
    return redirect(url_for('importador.home'))


@bp.route('/descargar_csv')
def descargar_csv():
    filepath = session.get('csv_path')
    return send_file(filepath, as_attachment=True)
