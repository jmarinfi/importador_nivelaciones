import os
import re
from flask import (
    current_app, flash, redirect, render_template, request, session, url_for, send_file
)
from werkzeug.utils import secure_filename
from .utils_app import deserializar_csv_gsi, deserializar_csv_gsi_list, deserializar_df_gsi, enviar_csv, enviar_csv_ids_inex, obtener_csv_gsi, serializar_csv_gsi, serializar_csv_gsi_list, serializar_df_gsi
from .utils_gsi import procesar_gsi
from . import imp_niv

# Extensiones de archivo permitidas
ALLOWED_EXTENSIONS = {'gsi', }

# Constantes para las claves de sesión
DF_GSI_FILENAME = 'df_gsi_filename'
ERROR_DE_CIERRE = 'error_de_cierre'
DISTANCIA_TOTAL = 'distancia_total'
ERROR_KM_POSTERIORI = 'error_km_posteriori'
TOLERANCIA = 'tolerancia'
DF_GSI_PATH = 'df_gsi_path'
ITINERARIO_ACEPTADO_STR = 'itinerario_aceptado_str'
ITINERARIO_ACEPTADO_INT = 'itinerario_aceptado_int'
CSV_GSI_PATH = 'csv_gsi_path'
CSV_GSI_LIST_PATH = 'csv_gsi_list_path'


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@imp_niv.route('/', methods=('GET', 'POST'))
def home():
    # Si la solicitud es POST, procesamos el archivo enviado
    if request.method == 'POST':
        return handle_post_request()

    # Si no es POST, simplemente renderizamos la página de inicio
    return render_template('imp_niv/home.html')


def handle_post_request():
    """Maneja las solicitudes POST al endpoint de inicio."""

    # Verificar si el archivo está presente en la solicitud
    if 'formFile' not in request.files:
        flash('No hay archivo', category='error')
        return redirect(request.url)

    file = request.files['formFile']

    # Verificar si el nombre del archivo está vacío
    if file.filename == '':
        flash('No hay ningún archivo seleccionado', category='error')
        return redirect(request.url)

    # Procesar el archivo si tiene una extensión válida
    if file and allowed_file(file.filename):
        return process_and_render(file)

    # Mostrar un mensaje de error si el archivo no tiene una extensión válida
    flash('Archivo no válido. Sólo se admiten archivos gsi', category='error')
    return redirect(request.url)


def process_and_render(file):
    """Procesa el archivo GSI y renderiza los resultados."""

    # Guardar el archivo en el directorio de subida
    session[DF_GSI_FILENAME] = secure_filename(file.filename)
    file_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], session.get(DF_GSI_FILENAME))
    file.save(file_path)

    # Intentar procesar el archivo y capturar cualquier excepción
    try:
        df_gsi, error_de_cierre, distancia_total, error_km_posteriori, tolerancia = procesar_gsi(
            file_path)
        session[ERROR_DE_CIERRE] = error_de_cierre
        session[DISTANCIA_TOTAL] = distancia_total
        session[ERROR_KM_POSTERIORI] = error_km_posteriori
        session[TOLERANCIA] = tolerancia
        serializar_df_gsi(df_gsi)

        # Borrar el archivo subido
        os.remove(file_path)
    except Exception as e:
        return render_template('imp_niv/500_generic.html', e=e), 500

    # Renderizar la página de inicio con los resultados
    return render_template(
        'imp_niv/home.html', tables=df_gsi,
        error_de_cierre=error_de_cierre,
        distancia_total=distancia_total,
        error_km_posteriori=error_km_posteriori,
        tolerancia=tolerancia
    )


@imp_niv.route('/descargar-estadillos')
def descargar_estadillos():
    filepath = os.path.join('../files', 'Estadillos.xlsx')
    return send_file(filepath, as_attachment=True)


@imp_niv.route('/procesar', methods=['POST'])
def procesar():
    # Manejar el rechazo de itinerarios
    if request.form.get('rechazar'):
        return handle_rechazar_gsi()

    # Manejar la aceptación de itinerarios
    if request.form.get('aceptar') or request.form.get('fechaInput'):
        return handle_aceptar_gsi()

    # Manejar la aceptación de todos los itinerarios
    if request.form.get('aceptar-todos'):
        return handle_aceptar_todos_gsi()

    # Redirigir a la página de inicio si se rechazan todos los itinerarios
    return redirect(url_for('importador.home'))


def handle_rechazar_gsi():
    """Maneja el rechazo de itinerarios."""
    itinerario_rechazado_str = request.form.get('rechazar')
    itinerario_rechazado_int = int(itinerario_rechazado_str)

    # Eliminar el itinerario rechazado del dataframe
    df_gsi = deserializar_df_gsi(session.get(DF_GSI_PATH))
    df_gsi = [(itinerario[0], itinerario[1])
              for itinerario in df_gsi if itinerario[0] != itinerario_rechazado_int]

    # Actualizar las sesiones
    update_session_without_itinerary(itinerario_rechazado_str)

    # Serializar y renderizar
    serializar_df_gsi(df_gsi)
    return render_template('imp_niv/home.html', tables=df_gsi,
                           error_de_cierre=session.get(ERROR_DE_CIERRE),
                           distancia_total=session.get(DISTANCIA_TOTAL),
                           error_km_posteriori=session.get(
                               ERROR_KM_POSTERIORI),
                           tolerancia=session.get(TOLERANCIA))


def handle_aceptar_gsi():
    """Maneja la aceptación de itinerarios."""
    # Si no se ha ingresado una fecha, renderizar la página de procesamiento para solicitar la fecha
    if not request.form.get('fechaInput'):
        session[ITINERARIO_ACEPTADO_STR] = request.form.get('aceptar')
        session[ITINERARIO_ACEPTADO_INT] = int(
            session.get(ITINERARIO_ACEPTADO_STR))
        return render_template('imp_niv/procesar.html')

    # Si se ha ingresado una fecha, procesar el itinerario aceptado
    return process_itinerary_with_date()


def handle_aceptar_todos_gsi():
    """Maneja la aceptación de todos los itinerarios."""
    session[ITINERARIO_ACEPTADO_STR] = 'todos'
    session[ITINERARIO_ACEPTADO_INT] = 0
    return render_template('imp_niv/procesar.html')


def update_session_without_itinerary(itinerario_rechazado_str):
    """Actualiza las variables de sesión eliminando el itinerario rechazado."""
    session[ERROR_DE_CIERRE] = {int(k): v for k, v in session.get(
        ERROR_DE_CIERRE).items() if k != itinerario_rechazado_str}
    session[DISTANCIA_TOTAL] = {int(k): v for k, v in session.get(
        DISTANCIA_TOTAL).items() if k != itinerario_rechazado_str}
    session[ERROR_KM_POSTERIORI] = {int(k): v for k, v in session.get(
        ERROR_KM_POSTERIORI).items() if k != itinerario_rechazado_str}
    session[TOLERANCIA] = {int(k): v for k, v in session.get(
        TOLERANCIA).items() if k != itinerario_rechazado_str}


def process_itinerary_with_date():
    """Procesa el itinerario basado en la fecha proporcionada."""

    df_gsi = deserializar_df_gsi(session.get(DF_GSI_PATH))
    fecha = request.form.get('fechaInput')
    itinerario_aceptado = session.get(ITINERARIO_ACEPTADO_STR)
    # Si se ha aceptado un itinerario específico, procesarlo
    if itinerario_aceptado != 'todos':
        df_gsi = [(itinerario[0], itinerario[1])
                  for itinerario in df_gsi if itinerario[0] == session.get(ITINERARIO_ACEPTADO_INT)]
        csv_gsi, ids_inexistentes = obtener_csv_gsi(df_gsi, fecha)
        serializar_csv_gsi(csv_gsi, itinerario_aceptado)

        # Enviar el CSV de ids inexistentes por FTP
        try:
            enviar_csv_ids_inex(ids_inexistentes, itinerario_aceptado)
        except Exception as e:
            flash(
                'Ha ocurrido un error al enviar el CSV de ids inexistentes', category='error')

        # Renderizar la página de procesamiento con los resultados
        return render_template('imp_niv/procesar.html', csv_gsi=csv_gsi, ids_inexistentes=ids_inexistentes)

    # Si se han aceptado todos los itinerarios, procesarlos
    else:
        csv_gsi_list = []
        for itinerario in df_gsi:
            csv_gsi, ids_inexistentes = obtener_csv_gsi(
                itinerario, fecha)
            csv_gsi_list.append(
                (itinerario[0], csv_gsi, ids_inexistentes))
            serializar_csv_gsi_list(csv_gsi_list)

            # Enviar el CSV de ids inexistentes por FTP
            try:
                enviar_csv_ids_inex(ids_inexistentes, itinerario[0])
            except Exception as e:
                flash(
                    'Ha ocurrido un error al enviar el CSV de ids inexistentes', category='error')

        # Renderizar la página de procesamiento con los resultados
        return render_template('imp_niv/procesar.html', csv_gsi_list=csv_gsi_list)


@imp_niv.route('/enviar', methods=['POST'])
def enviar():
    # Si se acepta un itinerario específico
    if request.form.get('aceptar'):
        return handle_enviar_csv()

    # Si se aceptan todos los itinerarios
    if request.form.get('aceptar-todos'):
        return handle_enviar_csv_list()

    # Si se rechaza un reporte individual
    if request.form.get('rechazar'):
        return handle_rechazar_reporte()

    # Si se rechazan todos los reportes
    flash('Los reportes rechazados no se han importado', category='warning')
    return redirect(url_for('importador.home'))


def handle_enviar_csv():
    """Maneja la aceptación de un itinerario específico."""

    itinerario_aceptado = int(request.form.get('aceptar'))
    csv_gsi = deserializar_csv_gsi(session.get(CSV_GSI_PATH))
    csv_gsi = csv_gsi[['FECHA', 'NOM_SENSOR', 'Cota comp.']]

    # Enviar el CSV por FTP
    try:
        enviar_csv(csv_gsi, itinerario_aceptado)
    except Exception as e:
        return render_template(
            'imp_niv/500_generic.html',
            e=e,
            message='No se ha podido enviar el archivo. Vuelve a intentarlo o descarga el CSV e impórtalo manualmente'
        )

    # Renderizar la página de envío con los resultados
    cleanup()
    return render_template('imp_niv/enviar.html', csv=csv_gsi)


def handle_enviar_csv_list():
    """Maneja la aceptación de todos los itinerarios."""

    csv_gsi_list = deserializar_csv_gsi_list(session.get(CSV_GSI_LIST_PATH))
    csv_list = [(itinerario[0], itinerario[1][['FECHA', 'NOM_SENSOR', 'Cota comp.']])
                for itinerario in csv_gsi_list]
    for csv in csv_list:
        enviar_csv(csv[1], csv[0])

    # Renderizar la página de envío con los resultados
    cleanup()
    return render_template('imp_niv/enviar.html', csv_list=csv_list)


def handle_rechazar_reporte():
    """Maneja el rechazo de un itinerario específico."""

    itinerario_rechazado = int(request.form.get('rechazar'))

    # Eliminar el itinerario rechazado de los dataframes
    df_gsi = deserializar_df_gsi(session.get(DF_GSI_PATH))
    df_gsi = [(itinerario[0], itinerario[1])
              for itinerario in df_gsi if itinerario[0] != itinerario_rechazado]
    csv_gsi_list = deserializar_csv_gsi_list(session.get(CSV_GSI_LIST_PATH))
    csv_gsi_list = [(itinerario[0], itinerario[1], itinerario[2])
                    for itinerario in csv_gsi_list if itinerario[0] != itinerario_rechazado]
    if len(df_gsi) == 0:
        flash('Los reportes rechazados no se han importado', category='warning')
        return redirect(url_for('importador.home'))

    # Actualizar las sesiones
    update_session_without_itinerary(itinerario_rechazado)

    # Serializar y renderizar
    serializar_df_gsi(df_gsi)
    serializar_csv_gsi_list(csv_gsi_list)
    return render_template('imp_niv/procesar.html', csv_gsi_list=csv_gsi_list)


@imp_niv.route('/descargar_csv')
def descargar_csv():
    """Descarga el CSV de un itinerario específico."""

    # Viniendo de una lista de CSV, el itinerario estará en los argumentos de la solicitud,
    # de lo contrario, estará en la sesión.
    if request.args.get('itinerario'):
        itinerario = request.args.get('itinerario')
    else:
        itinerario = session.get(ITINERARIO_ACEPTADO_STR)

    # Construir la ruta del archivo CSV
    filename = session.get('df_gsi_filename')
    csv_filename = re.sub(r'\.gsi', '.csv',
                          filename, flags=re.IGNORECASE)
    csv_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'], f'csv_{itinerario}_' + csv_filename)

    # Enviar el archivo CSV
    return send_file(csv_path, as_attachment=True)


def cleanup():
    """Elimina todos los archivos temporales JSON, si existen, que se han serializado durante esta sesión, y borra las variables de sesión."""

    try:
        os.remove(session.get(DF_GSI_PATH))
    except:
        pass

    try:
        os.remove(session.get(CSV_GSI_PATH))
    except:
        pass

    try:
        os.remove(session.get(CSV_GSI_LIST_PATH))
    except:
        pass
