from datetime import datetime
import json

from pydantic import BaseModel

from .serv_tecnicos import ContrServTecnicos


class ContrModelo:
    def __init__(self) -> None:
        self.serv_tecn = ContrServTecnicos()
        self.noms_campo = None
        self.csv = None

    def set_noms_campo(self, noms_campo):
        self.noms_campo = noms_campo
        self.noms_sensor = self.get_noms_sensor(noms_campo)
        self.noms_sensor_clean = [key for key, value in self.noms_sensor.items()]
        self.tres_ult_lect = self.get_tres_ultimas_lecturas()
        self.tres_ult_med = self.get_tres_ultimas_medidas()
        self.ult_ref = self.get_ultima_referencia()
        self.lect_ini = self.get_lectura_inicial()
        self.report = self.get_reporte()
        return self
    
    def set_csv(self, csv):
        self.csv = csv
        return self

    def get_noms_sensor(self, noms_campo):
        return self.serv_tecn.get_noms_sensor(noms_campo)
    
    def get_tres_ultimas_lecturas(self):
        return self.serv_tecn.get_tres_ultimas_lecturas(self.noms_sensor_clean)
    
    def get_tres_ultimas_medidas(self):
        return self.serv_tecn.get_tres_ultimas_medidas(self.noms_sensor_clean)
    
    def get_ultima_referencia(self):
        return self.serv_tecn.get_ultima_referencia(self.noms_sensor_clean)
    
    def get_lectura_inicial(self):
        return self.serv_tecn.get_lectura_inicial(self.noms_sensor_clean)
    
    def get_reporte(self):
        lineas_reporte = [
            LineaReporte(
                nom_sensor=key,
                nom_campo=value,
                ult_lect=self.tres_ult_lect.get(key, [None, None, None])[2],
                penult_lect=self.tres_ult_lect.get(key, [None, None, None, None, None])[4],
                antepenult_lect=self.tres_ult_lect.get(key, [None, None, None, None, None, None, None])[6],
                ult_medida=self.tres_ult_med.get(key, [None, None, None])[2],
                penult_medida=self.tres_ult_med.get(key, [None, None, None, None, None])[4],
                antepenult_medida=self.tres_ult_med.get(key, [None, None, None, None, None, None, None])[6],
                fecha_ref=self.ult_ref.get(key, [None, None])[1],
                lect_ref=self.ult_ref.get(key, [None, None, None])[2],
                medida_ref=self.ult_ref.get(key, [None, None, None, None])[3],
                fecha_ini=self.lect_ini.get(key, [None, None])[1],
                lect_ini=self.lect_ini.get(key, [None, None, None])[2],
                medida_ini=self.lect_ini.get(key, [None, None, None, None])[3]
            ) for key, value in self.noms_sensor.items()
        ]
        
        return Reporte(
            lineas_reporte=lineas_reporte
        )
    
    def get_reporte_json(self):
        return self.report.model_dump()
    
    def enviar_csv(self):
        self.serv_tecn.send_ftp(self.csv)

    def get_listas_json(self):
        listas = [
            ListaItinerario(
                id_lista = item[0],
                nom_lista=item[1],
                descripcion=item[2],
                id_rio=item[3],
                nom_presa=item[4]
            ).model_dump() for item in self.serv_tecn.get_listas().values()
        ]

        return listas
    
    def get_sensors_lista_json(self, id_lista):
        sensores_listas = [
            SensoresLista(
                id_lista=item[0],
                id_sensor=item[1],
                nom_sensor=item[2],
                id_externo=item[3],
                descripcion=item[4],
                id_sistema=item[5], 
                ult_lect=item[6],
                ult_fecha=item[7], 
                id_inc_estado=item[8],
                comentario=item[9]
            ).model_dump() for item in self.serv_tecn.get_sensors_lista(id_lista).values()
        ]
        return sensores_listas
    

class LineaReporte(BaseModel):
    nom_campo: str
    nom_sensor: str
    ult_lect: float | None = None
    ult_medida: float |None = None
    penult_lect: float |None = None
    penult_medida: float |None = None
    antepenult_lect: float |None = None
    antepenult_medida: float |None = None
    fecha_ref: datetime |None = None
    lect_ref: float |None = None
    medida_ref: float |None = None
    fecha_ini: datetime |None = None
    lect_ini: float |None = None
    medida_ini: float |None = None


class Reporte(BaseModel):
    lineas_reporte: list[LineaReporte] | list[None] | None = None


class ListaItinerario(BaseModel):
    id_lista: int
    nom_lista: str
    descripcion: str | None = None
    id_rio: int
    nom_presa: str


class SensoresLista(BaseModel):
    id_lista: int
    id_sensor: int
    nom_sensor: str
    id_externo: str
    descripcion: str
    id_sistema: int
    ult_lect: float | None = None
    ult_fecha: datetime | None = None
    id_inc_estado: int | None = None
    comentario: str | None = None
