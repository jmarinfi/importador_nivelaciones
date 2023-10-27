from datetime import datetime
from typing import List
from pydantic import BaseModel



class LineReporte(BaseModel):
    fecha: datetime | None = None
    nom_sensor: str
    cota_comp: float | None = None
    nom_campo: str
    ult_lect: float
    penult_lect: float
    antepenult_lect: float
    fecha_ref: datetime
    lect_ref: float
    medida_ref: float
    medida: float
    dif_ult_med: float
    dif_penult_med: float
    dif_antepenult_med: float


class ItinerarioReporte(BaseModel):
    lineas_reporte: List[LineReporte]
    