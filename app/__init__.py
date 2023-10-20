import os
from flask import Flask

from database import db


def create_app(test_config=None):
    """Crea y configura la instancia de la aplicación Flask"""

    app = Flask(__name__, instance_relative_config=True)

    if test_config is None:
        # Carga la instancia config, si existe, cuando no se está en modo de pruebas
        app.config.from_object('config.Config')

    else:
        # Carga la configuración test_config si se pasa como parámetro
        app.config.from_mapping(test_config)

    # Crea la carpeta de almacenamiento de archivos y de la instancia si no existen
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'])
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Inicializa la base de datos
    db.init_app(app)

    # Registra los blueprints
    from .imp_niv import imp_niv_bp
    app.register_blueprint(imp_niv_bp)

    return app
