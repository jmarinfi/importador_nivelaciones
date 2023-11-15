// Autor: Joan Marín

// Importar módulos
import { showAlertDanger, showAlertSuccess, createElement, formatDate } from "./global_utils.js";
import { ReportLine, GsiInxLine } from "./report_utils.js";
import { CsvLine } from "./csv_utils.js";


// Declaración de constantes
const REGEX_GSI = /([0-9]{2}[0-9.])([0-9.]{3})([+\-])([^\s]{8,16})\s/g;
const WI_CONSTANTS = {
    'NEW_ITINERARY': '410',
    'NEW_LINE': '110',
    'DIST_MIRA': '32',
    'COTA': '83',
    'ESPALDA': '331',
    'FRENTE': '332',
    'RADIADO': '333',
    'MED_REP': '390',
    'DESV_EST': '391',
    'MEDIANA': '392',
    'BALANCE': '573',
    'DIST_TOTAL': '574'
};


// Clase para una línea de GSI
class GsiLine {

    constructor(metodo, numItinerario, nomCampo) {
        this.metodo = metodo;
        this.numItinerario = numItinerario;
        this.nomCampo = nomCampo;
        this.distMira = null;
        this.cota = null;
        this.espalda = null;
        this.frente = null;
        this.radiado = null;
        this.medRep = null;
        this.desvEst = null;
        this.mediana = null;
        this.balance = null;
        this.distTotal = null;
        this.distAcum = null;
        this.cotaComp = null;
    }

    toOrderedObject() {
        return {
            'metodo': this.metodo,
            'itinerario': this.numItinerario,
            'nom_campo': this.nomCampo,
            'dist_mira': this.distMira,
            'cota': this.cota,
            'espalda': this.espalda,
            'frente': this.frente,
            'radiado': this.radiado,
            'med_rep': this.medRep,
            'desv_est': this.desvEst,
            'mediana': this.mediana,
            'balance': this.balance,
            'dist_total': this.distTotal,
            'dist_acum': this.distAcum,
            'cota_comp': this.cotaComp
        };
    }
}


// Clase para un itinerario de GSI
class Itinerary {

    constructor(numItinerario, metodo, fecha) {
        this.numItinerario = numItinerario;
        this.metodo = metodo;
        this.fecha = fecha;
        this.errorDeCierre = null;
        this.tolerancia = null;
        this.errorKm = null;
        this.distTotal = null;
        this.linesGsi = [];
        this.isCompensated = true;
        this.isDiscarded = false;
        this.headerTable = null;
        this.linesReport = [];
        this.linesGsiInx = [];
        this.linesCsv = [];
    }

    addLine(line) {
        this.linesGsi.push(line);
    }

    setErrorDeCierre() {
        const cotaInicial = this.linesGsi.find(line => line.cota).cota;
        const cotaFinal = [...this.linesGsi].reverse().find(line => line.cota).cota;
        this.errorDeCierre = (cotaFinal - cotaInicial) * 1000;
    }

    setDistTotal() {
        this.distTotal = this.linesGsi[this.linesGsi.length - 1].distAcum;
    }

    getSqrtDistTotal() {
        return Math.sqrt(this.distTotal / 1000);
    }

    setErrorKm() {
        this.errorKm = Math.abs(this.errorDeCierre / this.getSqrtDistTotal());
    }

    setTolerancia() {
        this.tolerancia = 0.3 * this.getSqrtDistTotal();
    }

    compensateCotas() {
        this.linesGsi.forEach(line => {
            line.cotaComp = line.cota ? line.cota - (line.distAcum * (this.errorDeCierre / 1000) / this.distTotal) : null;
        });
    }

    setCompensation(isCompensated) {
        this.isCompensated = isCompensated;
        this.setHeader(isCompensated);
    }

    setHeader() {
        if (this.isCompensated) {
            this.headerTable =  Object.keys(this.linesGsi[0]?.toOrderedObject());
        } else {
            this.headerTable =  Object.keys(this.linesGsi[0]?.toOrderedObject()).filter(key => key != 'cota_comp');
        }
    }

    setDistAcum() {
        let distAcum = 0.0;
        this.linesGsi.forEach(line => {
            line.distAcum = distAcum;
            if (line.distMira && !line.radiado) {
                distAcum += line.distMira;
                line.distAcum = distAcum;
            }
        });
    }

    setCalculations() {
        this.setHeader();
        this.setDistAcum();
        this.setErrorDeCierre();
        this.setDistTotal();
        this.setErrorKm();
        this.setTolerancia();
        this.compensateCotas();
    }

    getUniqueNames() {
        return [...new Set(this.linesGsi.map(line => line.nomCampo))];
    }

    setLinesGsiInx() {
        const linesGsiInx = this.linesGsi.filter(line => line.cota && !this.linesReport.find(lineReport => lineReport.nomCampo == line.nomCampo));
        linesGsiInx.forEach(line => {
            const lectura = this.isCompensated ? line.cotaComp : line.cota;
            this.linesGsiInx.push(new GsiInxLine(
                this.numItinerario,
                line.nomCampo,
                formatDate(this.fecha),
                lectura
            ));
        });
    }

    setLinesCsv() {
        const linesCsv = this.linesReport.filter(line => !line.isDiscarded);
        linesCsv.forEach(line => {
            const lectura = this.isCompensated ? line.cotaComp : line.cota;
            this.linesCsv.push(new CsvLine(
                line.nomSensor,
                formatDate(this.fecha),
                lectura
            ));
        });
    }
}


// Clase para procesar el GSI
class Gsi {

    constructor(file, datetime, regexGsi, wi_constants) {
        this.file = file;
        this.datetime = datetime;
        this.regexGsi = regexGsi;
        this.wi_constants = wi_constants;
        this.content = null;
        this.itineraries = [];
    }

    readFile() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(this.file);
            reader.onload = () => {
                resolve(reader.result);
            }
            reader.onerror = () => {
                reject(reader.error);
            }
        });
    }

    getMetodo(data) {
        switch (data) {
            case '1':
                return 'EF';
            case '2':
                return 'EFFE';
            case '3':
                return 'aEF';
            case '4':
                return 'aEFFE';
            case '10':
                return 'Comprob_y_ajuste';
            default:
                return 'Desconocido';
        }
    }

    loadItineraries() {
        const matches = this.content.matchAll(this.regexGsi);
        let numItinerario = 0;
        let itinerarioActual = null;
        let lineaGsiActual = null;

        for (const match of matches) {
            const wordIndex = match[1].replace(/\.+/, '');
            const infCompl = match[2];
            const signo = match[3];
            const data = match[4].replace(/[.?]+/, '');
            switch (wordIndex) {
                case this.wi_constants.NEW_ITINERARY:
                    numItinerario += 1;
                    const metodo = this.getMetodo(data);
                    itinerarioActual = new Itinerary(
                        numItinerario, metodo, this.datetime
                    )
                    this.addItinerary(itinerarioActual);
                    break;
                case this.wi_constants.NEW_LINE:
                    lineaGsiActual = new GsiLine(itinerarioActual.metodo, itinerarioActual.numItinerario, data.replace(/^0+/, ''));
                    itinerarioActual.addLine(lineaGsiActual);
                    break;
                case this.wi_constants.DIST_MIRA:
                    lineaGsiActual.distMira = parseFloat(signo + data) / 100000;
                    break;
                case this.wi_constants.COTA:
                    lineaGsiActual.cota = parseFloat(signo + data) / 100000;
                    break;
                case this.wi_constants.ESPALDA:
                    lineaGsiActual.espalda = parseFloat(signo + data) / 100000;
                    break;
                case this.wi_constants.FRENTE:
                    lineaGsiActual.frente = parseFloat(signo + data) / 100000;
                    break;
                case this.wi_constants.RADIADO:
                    lineaGsiActual.radiado = parseFloat(signo + data) / 100000;
                    break;
                case this.wi_constants.MED_REP:
                    lineaGsiActual.medRep = parseInt(signo + data);
                    break;
                case this.wi_constants.DESV_EST:
                    lineaGsiActual.desvEst = parseInt(signo + data);
                    break;
                case this.wi_constants.MEDIANA:
                    lineaGsiActual.mediana = parseInt(signo + data);
                    break;
                case this.wi_constants.BALANCE:
                    lineaGsiActual.balance = parseFloat(signo + data) / 100000;
                    break;
                case this.wi_constants.DIST_TOTAL:
                    lineaGsiActual.distTotal = parseFloat(signo + data) / 100000;
                    break;
                default:
                    break;
            }
        }
        this.itineraries.forEach(itinerary => {
            itinerary.setCalculations();
        });
    }

    async loadContent() {
        try {
            this.content = await this.readFile();
            this.loadItineraries();
        } catch (error) {
            throw error;
        }
    }

    addItinerary(itinerary) {
        this.itineraries.push(itinerary);
    }

    getUniqueNamesAllItineraries() {
        return this.itineraries.filter(itinerary => !itinerary.isDiscarded).flatMap(itinerary => itinerary.getUniqueNames());
    }

    setLinesReport(arrayLinesReport) {
        arrayLinesReport.forEach(lineReport => {
            const itinerary = this.itineraries.find(itinerary => itinerary.linesGsi.find(line => line.nomCampo == lineReport.nom_campo));
            const reportLine = new ReportLine(
                itinerary.numItinerario,
                lineReport.antepenult_lect,
                lineReport.antepenult_medida,
                lineReport.fecha_ini,
                lineReport.fecha_ref,
                lineReport.lect_ini,
                lineReport.lect_ref,
                lineReport.medida_ini,
                lineReport.medida_ref,
                lineReport.nom_campo,
                lineReport.nom_sensor,
                lineReport.penult_lect,
                lineReport.penult_medida,
                lineReport.ult_lect,
                lineReport.ult_medida
            );
            reportLine.isCompensated = itinerary.isCompensated;
            reportLine.cota = itinerary.linesGsi.filter(line => line.cota).find(line => line.nomCampo == lineReport.nom_campo).cota;
            reportLine.cotaComp = itinerary.linesGsi.filter(line => line.cota).find(line => line.nomCampo == lineReport.nom_campo).cotaComp;
            reportLine.setMedida();
            reportLine.setDifUltMed();
            reportLine.setDifPenultMed();
            reportLine.setDifAntepenultMed();
            itinerary.linesReport.push(reportLine);

        });
    }
}


// Función asíncrona para instanciar y procesar el GSI
export async function processGsi(file, datetime) {
    const gsi = new Gsi(file, datetime, REGEX_GSI, WI_CONSTANTS);
    await gsi.loadContent();
    return gsi;
}


// Función para crear tarjetas para un itinerario
export function createCardsGroup(CardGroupObject, parentDiv) {
    const cardsGroupElement = createElement('div', CardGroupObject.id, CardGroupObject.classes, parentDiv, '', CardGroupObject.attributes);
    CardGroupObject.cards.forEach(cardObject => {
        const cardElement = createElement('div', cardObject.id, cardObject.classes, cardsGroupElement, '', cardObject.attributes);
        const cardHeaderElement = createElement('div', 'header-' + cardObject.id, cardObject.header.classes, cardElement, cardObject.header.text);
        const cardBodyElement = createElement('div', 'body-' + cardObject.id, cardObject.body.classes, cardElement);
        const cardTitleElement = createElement('h5', 'title-' + cardObject.id, cardObject.body.title.classes, cardBodyElement, cardObject.body.title.text,);
        const cardTextElement = createElement('p', 'text-' + cardObject.id, cardObject.body.text.classes, cardBodyElement, cardObject.body.text.text);
    });
}

