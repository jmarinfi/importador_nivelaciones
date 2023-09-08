import functools
import os
from flask import (
    Blueprint, current_app, flash, g, redirect, render_template, request, send_from_directory, session, url_for, send_file
)
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {'gsi', }

bp = Blueprint('importador', __name__)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('/', methods=('GET', 'POST'))
def home():
    if request.method == 'POST':
        if 'formFile' not in request.files:
            flash('No hay archivo')
            return redirect(request.url)
        file = request.files['formFile']
        if file.filename == '':
            flash('No hay ningún archivo seleccionado')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(
                current_app.config['UPLOAD_FOLDER'], filename))
            return render_template('home.html', gsi=file)
        flash('Archivo no válido. Sólo se admiten archivos gsi')
    return render_template('home.html')


@bp.route('/uploads/<name>')
def download_file(name):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], name)


@bp.route('/descargar-estadillos')
def descargar_estadillos():
    filepath = os.path.join('../files', 'Estadillos.xlsx')
    return send_file(filepath, as_attachment=True)
