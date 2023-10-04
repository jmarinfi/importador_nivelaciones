import os


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_LIMA_URL')
    UPLOAD_FOLDER = os.path.abspath('./files/gsi')
    FTP_SERVER_TD = os.getenv('FTP_SERVER_TD')
    FTP_USER_TD = os.getenv('FTP_USER_TD')
    FTP_PASS_TD = os.getenv('FTP_PASS_TD')
    