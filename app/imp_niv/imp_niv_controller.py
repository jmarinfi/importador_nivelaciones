import os


def save_file(file, upload_folder):
    """Guarda el archivo en el directorio de archivos subidos."""

    filepath = os.path.join(upload_folder, file.filename)
    file.save(filepath)
    return filepath


def add_to_session(session, dict):
    """Agrega los elementos de un diccionario a la sesión."""

    for key, value in dict.items():
        session[key] = value
