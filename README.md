# importador_nivelaciones

## Importador de nivelaciones en formato web.

Instrucciones para instalar y probar la aplicación:

- Clonar repositorio localmente.
- Crear entorno virtual.
- Instalar las dependencias con:

```console
pip install -r requirements.txt
```

- El comando para lanzar la aplicación en formato debug es:

```console
flask --app imp_niv run --debug
```

## Futuras mejoras

- Sería necesaria autenticación para controlar qué usuarios procesan importan cuáles nivelaciones.
- Habría que almacenar todos los GSI procesados en alguna ubicación remota, en vez de en el sistema de ficheros de la app.
- Habría que enviar mails cuando se detecten archivos GSI manipulados.