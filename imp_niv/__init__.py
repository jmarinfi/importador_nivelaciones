import os
from flask import Flask


def create_app(test_config=None):
    """
    Application factory: crea y configura la app
    """
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev'
    )
    files_dir_path = './files'
    gsi_dir_path = './files/gsi'
    os.makedirs(files_dir_path, exist_ok=True)
    os.makedirs(gsi_dir_path, exist_ok=True)
    UPLOAD_FOLDER = os.path.abspath(gsi_dir_path)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    if test_config is None:
        # Carga la instancia config, si existe, cuando no se esté en modo de pruebas
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Carga la cofiguración test_config si se pasa como parámetro
        app.config.from_mapping(test_config)

    # Garantiza que el directorio de la instancia existe
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    from . import importador
    app.register_blueprint(importador.bp)

    return app
