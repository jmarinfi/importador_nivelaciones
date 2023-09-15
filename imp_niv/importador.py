import datetime
import functools
import json
import os
from flask import (
    Blueprint, current_app, flash, g, redirect, render_template, request, send_from_directory, session, url_for, send_file, g
)
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from imp_niv.utils_app import obtener_df_gsi, serializar_df_gsi

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
        df_gsi = obtener_df_gsi(session['df_gsi_path'])
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
    if request.form.get('aceptar'):
        return 'TODO aceptar 1 itinerario'
    if request.form.get('aceptar-todos'):
        return 'TODO aceptar todos los itinerarios'
    return redirect(url_for('importador.home'))
