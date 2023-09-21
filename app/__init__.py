import os
from flask import Flask
import pymysql
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app(test_config=None):
    """
    Application factory: crea y configura la app
    """
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.getenv('SECRET_KEY')
    )

    # Crea los directorios y define el directorio de subidas
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

    from .imp_niv import imp_niv as imp_niv_blueprint
    app.register_blueprint(imp_niv_blueprint)

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_LIMA_URL')
    db.init_app(app)

    return app