export class CsvLine {
    constructor(nomSensor, fecha, lectura) {
        this.nomSensor = nomSensor;
        this.fecha = fecha;
        this.lectura = lectura;
    }

    toOrderedObject() {
        return {
            'fecha': this.fecha,
            'nom_sensor': this.nomSensor,
            'lectura': this.lectura
        };
    }

    toString() {
        return this.fecha + ';' + this.nomSensor + ';' + this.lectura;
    }
}