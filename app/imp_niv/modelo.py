from datetime import datetime
import json

from pydantic import BaseModel
from .serv_tecnicos import ContrServTecnicos


class ContrModelo:
    def __init__(self, noms_campo) -> None:
        self.noms_campo = noms_campo
        self.serv_tecn = ContrServTecnicos(noms_campo)
        self.noms_sensor = self.get_noms_sensor()
        self.noms_sensor_clean = [nom_sensor for nom_sensor, _ in self.noms_sensor]
        self.tres_ult_lect = self.get_tres_ultimas_lecturas()
        self.ult_ref = self.get_ultima_referencia()
        self.lect_ini = self.get_lectura_inicial()
        self.report = self.get_reporte()

    def get_noms_sensor(self):
        return self.serv_tecn.get_noms_sensor()
    
    def get_tres_ultimas_lecturas(self):
        return self.serv_tecn.get_tres_ultimas_lecturas(self.noms_sensor_clean)
    
    def get_ultima_referencia(self):
        return self.serv_tecn.get_ultima_referencia(self.noms_sensor_clean)
    
    def get_lectura_inicial(self):
        return self.serv_tecn.get_lectura_inicial(self.noms_sensor_clean)
    
    def get_reporte(self):
        lineas_reporte = []
        # TODO: Construir reporte
        return Reporte(
            lineas_reporte=lineas_reporte
        )
    
    def get_reporte_json(self):
        return self.report.model_dump()
    

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


class Reporte(BaseModel):
    lineas_reporte: list[LineaReporte] | list[None] | None = None