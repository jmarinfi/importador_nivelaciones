from ftplib import FTP
from io import BytesIO


def enviar_ftp(csv: str, remote_path: str, host: str, user: str, password: str) -> None:
    """Envía un csv a un servidor ftp"""

    with FTP(host=host, user=user, passwd=password) as ftp:
        csv_bytes = BytesIO(csv)
        # ftp.cwd('/LIMA/Linea_2')
        ftp.storbinary(f'STOR {remote_path}', csv_bytes)