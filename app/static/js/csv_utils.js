export class CsvLine {
    constructor(nomSensor, fecha, lectura) {
        this.nomSensor = nomSensor;
        this.fecha = fecha;
        this.lectura = lectura;
    }

    toOrderedObject() {
        return {
            'nom_sensor': this.nomSensor,
            'fecha': this.fecha,
            'lectura': this.lectura
        };
    }

    toString() {
        return this.nomSensor + ';' + this.fecha + ';' + this.lectura;
    }
}