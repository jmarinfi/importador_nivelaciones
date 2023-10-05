# Utiliza una imagen base de Python 3.11
FROM python:3.11

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia el archivo requirements .txt al contenedor
COPY requirements.txt requirements.txt

# Instala las dependencias del proyecto
RUN pip install -r requirements.txt

# Copia el contenido del directorio actual al contenedor en /app
COPY . .

# Expone el puerto 8000 para que la aplicación Flask pueda ser accedida
EXPOSE 8000

# Comando para iniciar la aplicación con Gunicorn
CMD [ "gunicorn", "-w", "4", "app:create_app()", "-b", "0.0.0.0:8000" ]
