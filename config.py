import os


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_LIMA_URL')
    UPLOAD_FOLDER = os.path.abspath('./files/gsi')