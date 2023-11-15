// Clase para una línea de reporte
export class ReportLine {
    constructor(numItinerario, antepenult_lect, antepenult_medida, fecha_ini, fecha_ref, lect_ini, lect_ref, medida_ini, medida_ref, nom_campo, nom_sensor, penult_lect, penult_medida, ult_lect, ult_medida) {
        this.numItinerario = numItinerario;
        this.antepenultLect = antepenult_lect;
        this.antepenultMedida = antepenult_medida;
        this.fechaIni = fecha_ini;
        this.fechaRef = fecha_ref;
        this.lectIni = lect_ini;
        this.lectRef = lect_ref;
        this.medidaIni = medida_ini;
        this.medidaRef = medida_ref;
        this.nomCampo = nom_campo;
        this.nomSensor = nom_sensor;
        this.penultLect = penult_lect;
        this.penultMedida = penult_medida;
        this.ultLect = ult_lect;
        this.ultMedida = ult_medida;
        this.isCompensated = null;
        this.cota = null;
        this.cotaComp = null;
        this.medida = null;
        this.difUltMed = null;
        this.difPenultMed = null;
        this.difAntepenultMed = null;
        this.isDiscarded = false;
    }

    setMedida() {
        const cota = this.isCompensated ? this.cotaComp : this.cota;
        let lectRef = this.lectRef;
        let medidaRef = this.medidaRef;
        if (!lectRef) {
            lectRef = this.lectIni;
            medidaRef = this.medidaIni;
        }
        if (cota && lectRef) {
            this.medida = (cota - lectRef) * 1000 + medidaRef;
        } else {
            this.medida = null;
        }
    }

    setDifUltMed() {
        if (this.medida && this.ultMedida) {
            this.difUltMed = this.medida - this.ultMedida;
        } else {
            this.difUltMed = null;
        }
    }

    setDifPenultMed() {
        if (this.medida && this.penultMedida) {
            this.difPenultMed = this.medida - this.penultMedida;
        } else {
            this.difPenultMed = null;
        }
    }

    setDifAntepenultMed() {
        if (this.medida && this.antepenultMedida) {
            this.difAntepenultMed = this.medida - this.antepenultMedida;
        } else {
            this.difAntepenultMed = null;
        }
    }

    toOrderedObject() {
        return {
            'nom_campo': this.nomCampo,
            'nom_sensor': this.nomSensor,
            'cota': this.cota,
            'cota_comp': this.cotaComp,
            'lect_ini': this.lectIni,
            'medida_ini': this.medidaIni,
            'lect_ref': this.lectRef,
            'medida_ref': this.medidaRef,
            'medida': this.medida,
            'dif_ult_med': this.difUltMed,
            'dif_penult_med': this.difPenultMed,
            'dif_antepenult_med': this.difAntepenultMed
        };
    }
}


// Clase para una línea de sensor inexistente en la base de datos
export class GsiInxLine {
    constructor(numItinerario, nomCampo, fecha, lectura) {
        this.numItinerario = numItinerario;
        this.nomCampo = nomCampo;
        this.fecha = fecha;
        this.lectura = lectura;
    }

    toOrderedObject() {
        return {
            'nom_campo': this.nomCampo,
            'fecha': this.fecha,
            'lectura': this.lectura
        };
    }

    toString() {
        return this.nomCampo + ';' + this.fecha + ';' + this.lectura;
    }
}