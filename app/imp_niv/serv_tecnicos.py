from datetime import datetime
from ftplib import FTP
from io import BytesIO
from flask import current_app
from sqlalchemy import text

from .. import db


class ContrServTecnicos:
    def __init__(self) -> None:
        self.db_metrolima = None
        self.ftp_metrolima = None

    def set_db_metrolima(self, db):
        if not self.db_metrolima:
            self.db_metrolima = DBMetroLima(db)
    
    def set_ftp_metrolima(self):
        if not self.ftp_metrolima:
            self.ftp_metrolima = FTPMetroLima(current_app.config['FTP_SERVER_TD'], current_app.config['FTP_USER_TD'], current_app.config['FTP_PASS_TD'])

    def close_db_metrolima(self):
        self.db_metrolima.close()

    def get_noms_sensor(self, noms_campo):
        self.set_db_metrolima(db)
        result = self.db_metrolima.get_noms_sensor(noms_campo)
        self.close_db_metrolima()
        return {nom_sensor: id_ext for nom_sensor, id_ext in result}
    
    def get_tres_ultimas_lecturas(self, noms_sensor):
        self.set_db_metrolima(db)
        result = self.db_metrolima.get_tres_ultimas_lecturas(noms_sensor)
        self.close_db_metrolima()
        return {item[0]: item for item in result}
    
    def get_tres_ultimas_medidas(self, noms_sensor):
        self.set_db_metrolima(db)
        result = self.db_metrolima.get_tres_ultimas_medidas(noms_sensor)
        self.close_db_metrolima()
        return {item[0]: item for item in result}
    
    def get_ultima_referencia(self, noms_sensor):
        self.set_db_metrolima(db)
        result = self.db_metrolima.get_ultima_referencia(noms_sensor)
        self.close_db_metrolima()
        return {item[0]: item for item in result}
    
    def get_lectura_inicial(self, noms_sensor):
        self.set_db_metrolima(db)
        result = self.db_metrolima.get_lectura_inicial(noms_sensor)
        self.close_db_metrolima()
        return {item[0]: item for item in result}
    
    def send_ftp(self, data, filename=f'{datetime.now().strftime("%Y%m%d%H%M%S")}.csv', remote_path=None):
        self.set_ftp_metrolima()
        if self.ftp_metrolima.ftpHost == '83.56.34.89':
            remote_path = '/LIMA/Linea_2'
        self.ftp_metrolima.send_ftp(data, filename, remote_path)

    def get_listas(self):
        self.set_db_metrolima(db)
        result = self.db_metrolima.get_listas()
        self.close_db_metrolima()
        return {item[0]: item for item in result}
    
    def get_sensors_lista(self, id_lista):
        self.set_db_metrolima(db)
        result = self.db_metrolima.get_sensors_lista(id_lista)
        self.close_db_metrolima()
        return {item[2]: item for item in result}


class DBMetroLima:
    def __init__(self, db) -> None:
        self.db = db

    def get_noms_sensor(self, id_ext_list):
        return self.db.session.execute(
            text('SELECT S.NOM_SENSOR, S.ID_EXTERNO FROM SENSOR S WHERE S.ID_SISTEMA <> 75 AND S.ID_EXTERNO IN :id_ext_list'),
            {'id_ext_list': id_ext_list}
        ).fetchall()
    
    def get_tres_ultimas_lecturas(self, noms_sensor):
        return self.db.session.execute(
            text("SELECT S.NOM_SENSOR AS SENSOR, (SELECT HH.FECHA_MEDIDA FROM HISTORICO HH WHERE HH.ID_SENSOR=H.ID_SENSOR AND HH.ID_ESTADO_DATO=0 AND HH.ID_FLAG<>'F' ORDER BY HH.FECHA_MEDIDA DESC LIMIT 1) AS ULTIMA_FECHA_MEDIDA, (SELECT HH.LECTURA FROM HISTORICO HH WHERE HH.ID_SENSOR=H.ID_SENSOR AND HH.FECHA_MEDIDA=ULTIMA_FECHA_MEDIDA) AS ULTIMA_LECTURA, (SELECT HANT.FECHA_MEDIDA FROM HISTORICO HANT WHERE HANT.ID_SENSOR=H.ID_SENSOR AND HANT.FECHA_MEDIDA<ULTIMA_FECHA_MEDIDA AND HANT.ID_ESTADO_DATO=0 AND HANT.ID_FLAG<>'F' ORDER BY HANT.FECHA_MEDIDA DESC LIMIT 1) AS PENULTIMA_FECHA_MEDIDA, (SELECT HANT.LECTURA FROM HISTORICO HANT WHERE HANT.ID_SENSOR=H.ID_SENSOR AND HANT.FECHA_MEDIDA=PENULTIMA_FECHA_MEDIDA) AS PENULTIMA_LECTURA, (SELECT PENULT.FECHA_MEDIDA FROM HISTORICO PENULT WHERE PENULT.ID_SENSOR=H.ID_SENSOR AND PENULT.FECHA_MEDIDA<PENULTIMA_FECHA_MEDIDA AND PENULT.ID_ESTADO_DATO=0 AND PENULT.ID_FLAG<>'F' ORDER BY PENULT.FECHA_MEDIDA DESC LIMIT 1) AS ANTEPENULTIMA_FECHA_MEDIDA, (SELECT PENULT.LECTURA FROM HISTORICO PENULT WHERE PENULT.ID_SENSOR=H.ID_SENSOR AND PENULT.FECHA_MEDIDA=ANTEPENULTIMA_FECHA_MEDIDA) AS ANTEPENTULTIMA_LECTURA FROM SENSOR S INNER JOIN HISTORICO H ON S.ID_SENSOR=H.ID_SENSOR WHERE S.NOM_SENSOR IN :noms_sensor GROUP BY SENSOR;"),
            {'noms_sensor': noms_sensor}
        ).fetchall()
    
    def get_ultima_referencia(self, nom_sensor_list):
        return self.db.session.execute(
            text("SELECT S.NOM_SENSOR AS SENSOR, H.FECHA_MEDIDA AS FECHA, H.LECTURA AS LECTURA, H.MEDIDA AS MEDIDA FROM HISTORICO H JOIN SENSOR S ON H.ID_SENSOR = S.ID_SENSOR WHERE S.NOM_SENSOR IN :nom_sensor_list AND H.ESREFERENCIA = 1 AND H.ID_ESTADO_DATO = 0 AND H.ID_FLAG <> 'F' AND H.FECHA_MEDIDA = (SELECT H1.FECHA_MEDIDA FROM HISTORICO H1 JOIN SENSOR S1 ON H1.ID_SENSOR = S1.ID_SENSOR WHERE S1.NOM_SENSOR = S.NOM_SENSOR AND H1.ESREFERENCIA = 1 AND H1.ID_ESTADO_DATO = 0 AND H1.ID_FLAG <> 'F' ORDER BY H1.FECHA_MEDIDA DESC LIMIT 1)"), 
            {'nom_sensor_list': nom_sensor_list}
        ).fetchall()
    
    def get_lectura_inicial(self, nom_sensor_list):
        return self.db.session.execute(
            text("SELECT S.NOM_SENSOR, H.FECHA_MEDIDA, H.LECTURA, H.MEDIDA FROM SENSOR S JOIN HISTORICO H ON S.ID_SENSOR = H.ID_SENSOR WHERE S.NOM_SENSOR IN :nom_sensor_list AND H.ID_ESTADO_DATO = 0 AND H.ID_FLAG <> 'F' AND H.FECHA_MEDIDA = (SELECT MIN(H1.FECHA_MEDIDA) FROM HISTORICO H1 JOIN SENSOR S1 ON H1.ID_SENSOR = S1.ID_SENSOR WHERE S1.NOM_SENSOR = S.NOM_SENSOR AND H1.ID_ESTADO_DATO = 0 AND H1.ID_FLAG <> 'F' GROUP BY H1.ID_SENSOR)"),
            {'nom_sensor_list': nom_sensor_list}
        ).fetchall()
    
    def get_tres_ultimas_medidas(self, noms_sensor):
        return self.db.session.execute(
            text("SELECT S.NOM_SENSOR AS SENSOR, (SELECT HH.FECHA_MEDIDA FROM HISTORICO HH WHERE HH.ID_SENSOR=H.ID_SENSOR AND HH.ID_ESTADO_DATO=0 AND HH.ID_FLAG<>'F' ORDER BY HH.FECHA_MEDIDA DESC LIMIT 1) AS ULTIMA_FECHA_MEDIDA, (SELECT HH.MEDIDA FROM HISTORICO HH WHERE HH.ID_SENSOR=H.ID_SENSOR AND HH.FECHA_MEDIDA=ULTIMA_FECHA_MEDIDA) AS ULTIMA_MEDIDA, (SELECT HANT.FECHA_MEDIDA FROM HISTORICO HANT WHERE HANT.ID_SENSOR=H.ID_SENSOR AND HANT.FECHA_MEDIDA<ULTIMA_FECHA_MEDIDA AND HANT.ID_ESTADO_DATO=0 AND HANT.ID_FLAG<>'F' ORDER BY HANT.FECHA_MEDIDA DESC LIMIT 1) AS PENULTIMA_FECHA_MEDIDA, (SELECT HANT.MEDIDA FROM HISTORICO HANT WHERE HANT.ID_SENSOR=H.ID_SENSOR AND HANT.FECHA_MEDIDA=PENULTIMA_FECHA_MEDIDA) AS PENULTIMA_MEDIDA, (SELECT PENULT.FECHA_MEDIDA FROM HISTORICO PENULT WHERE PENULT.ID_SENSOR=H.ID_SENSOR AND PENULT.FECHA_MEDIDA<PENULTIMA_FECHA_MEDIDA AND PENULT.ID_ESTADO_DATO=0 AND PENULT.ID_FLAG<>'F' ORDER BY PENULT.FECHA_MEDIDA DESC LIMIT 1) AS ANTEPENULTIMA_FECHA_MEDIDA, (SELECT PENULT.MEDIDA FROM HISTORICO PENULT WHERE PENULT.ID_SENSOR=H.ID_SENSOR AND PENULT.FECHA_MEDIDA=ANTEPENULTIMA_FECHA_MEDIDA) AS ANTEPENULTIMA_MEDIDA FROM SENSOR S INNER JOIN HISTORICO H ON S.ID_SENSOR=H.ID_SENSOR WHERE S.NOM_SENSOR IN :noms_sensor GROUP BY SENSOR;"),
            {'noms_sensor': noms_sensor}
        ).fetchall()
    
    def get_listas(self):
        return self.db.session.execute(
            text("SELECT L.ID_LISTA, L.NOM_LISTA, L.DESCRIPCION, L.ID_RIO, P.NOM_PRESA FROM LISTAS L JOIN PRESA P ON L.ID_PRESA = P.ID_PRESA WHERE L.ID_TECLECT = 35 ORDER BY P.ORDEN;"),
        ).fetchall()
    
    def get_sensors_lista(self, id_lista):
        return self.db.session.execute(
            text("SELECT LS.ID_LISTA, LS.ID_SENSOR, S.NOM_SENSOR, S.ID_EXTERNO, S.DESCRIPCION, S.ID_SISTEMA, (SELECT H.LECTURA FROM HISTORICO H WHERE H.ID_SENSOR = S.ID_SENSOR ORDER BY H.FECHA_MEDIDA DESC LIMIT 1) AS ULT_LECT, (SELECT H.FECHA_MEDIDA FROM HISTORICO H WHERE H.ID_SENSOR = S.ID_SENSOR ORDER BY H.FECHA_MEDIDA DESC LIMIT 1) AS ULT_FECHA, (SELECT II.ID_INC_ESTADO FROM INC_INCIDENCIAS II WHERE II.ID_SENSOR = S.ID_SENSOR AND (II.ID_INC_ESTADO = 10 OR II.ID_INC_ESTADO = 7) ORDER BY II.FECHA_ABIERTA DESC  LIMIT 1) AS ESTADO_ALARMA, (SELECT SM.COMENTARIO FROM SEGUIMIENTO_MANTENIMIENTO SM WHERE SM.ID_SENSOR = S.ID_SENSOR ORDER BY SM.FECHA_SEG DESC LIMIT 1) AS COMENTARIO FROM LISTAS_SENSORES LS JOIN SENSOR S ON LS.ID_SENSOR = S.ID_SENSOR WHERE LS.ID_LISTA = :id_lista AND S.ACTIVO = 1 ORDER BY LS.ORDEN;"),
            {'id_lista': id_lista}
        ).fetchall()
    
    def close(self):
        self.db.session.close()
    

class FTPMetroLima:
    def __init__(self, ftpHost, ftpUser, ftpPassword) -> None:
        self.ftpHost = ftpHost
        self.ftpUser = ftpUser
        self.ftpPassword = ftpPassword

    def send_ftp(self, data, filename, remote_path=None):
        with FTP(self.ftpHost, self.ftpUser, self.ftpPassword) as ftp:
            if remote_path:
                ftp.cwd(remote_path)
            ftp.storbinary(f'STOR {filename}', BytesIO(data))
