import functools
import os
from flask import (
    Blueprint, current_app, flash, g, redirect, render_template, request, send_from_directory, session, url_for, send_file
)
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException

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
            filename = secure_filename(file.filename)
            file.save(os.path.join(
                current_app.config['UPLOAD_FOLDER'], filename))
            print(current_app.config['UPLOAD_FOLDER'])
            # Se procesa el GSI, capturando las posibles excepciones que puedan ocurrir
            try:
                df_gsi, error_de_cierre, distancia_total, error_km_posteriori, tolerancia = procesar_gsi(
                    os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                )
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
