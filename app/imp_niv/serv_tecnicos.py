from sqlalchemy import text

from .. import db


class ContrServTecnicos:
    def __init__(self, noms_campo) -> None:
        self.noms_campo = noms_campo
        self.db_metrolima = DBMetroLima(db)

    def get_noms_sensor(self):
        return self.db_metrolima.get_noms_sensor(self.noms_campo)
    
    def get_tres_ultimas_lecturas(self, noms_sensor):
        return self.db_metrolima.get_tres_ultimas_lecturas(noms_sensor)
    
    def get_ultima_referencia(self, noms_sensor):
        return self.db_metrolima.get_ultima_referencia(noms_sensor)
    
    def get_lectura_inicial(self, noms_sensor):
        return self.db_metrolima.get_lectura_inicial(noms_sensor)


class DBMetroLima:
    def __init__(self, db) -> None:
        self.db = db

    def get_noms_sensor(self, id_ext_list):
        return self.db.session.execute(
            text('SELECT S.NOM_SENSOR, S.ID_EXTERNO FROM SENSOR S WHERE S.ID_EXTERNO IN :id_ext_list'),
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
