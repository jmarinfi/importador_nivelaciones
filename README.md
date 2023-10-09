# importador_nivelaciones

## Importador de nivelaciones en formato web.

Instrucciones para instalar y probar la aplicación:

- Clonar repositorio localmente.
- Crear entorno virtual con python-3.11.
- Instalar las dependencias con:

```console
pip install -r requirements.txt
```

- El comando para lanzar la aplicación en formato debug es:

```console
flask run --debug
```

Se deben configurar las siguientes variables de entorno:

```console
SECRET_KEY="La clave secreta que se utilizará para firmar la cookie de la sesión y otras funciones de seguridad"
DATABASE_LIMA_URL="La URL de conexión a la base de datos de metrolima"
FTP_SERVER_TD="Nombre de host del servidor FTP donde se envían los datos procesados"
FTP_USER_TD="Nombre de usuario del servidor FTP"
FTP_PASS_TD="Contraseña de acceso al servidor FTP"```
