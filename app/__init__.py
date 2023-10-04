import os
from flask import Flask
import pymysql

from database import db


def create_app(test_config=None):
    """
    Application factory: crea y configura la app
    """
    app = Flask(__name__, instance_relative_config=True)

    if test_config is None:
        # Carga la instancia config, si existe, cuando no se esté en modo de pruebas
        app.config.from_object('config.Config')
    else:
        # Carga la cofiguración test_config si se pasa como parámetro
        app.config.from_mapping(test_config)
    
    # Crea los directorios y define el directorio de subidas
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Garantiza que el directorio de la instancia existe
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    from .imp_niv import imp_niv as imp_niv_blueprint
    app.register_blueprint(imp_niv_blueprint)

    # Inicializa la base de datos
    db.init_app(app)

    # Inicializa la limpieza de archivos temporales
    from app.imp_niv.utils_app import init_cleanup
    init_cleanup(app)

    return app
