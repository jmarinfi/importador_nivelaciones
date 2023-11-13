// Autor: Joan Marín

// Importar módulos
import { showAlertDanger, showAlertSuccess, createElement, prepareLayout, buildTable, createButtonsGroup } from "./global_utils.js";

// Elementos de avisos
const alertSuccessDiv = document.getElementById("alert-success");
const alertSuccessP = document.getElementById("alert-success-text");
const alertDangerDiv = document.getElementById("alert-danger");
const alertDangerP = document.getElementById("alert-danger-text");

// Elementos formulario de descarga de estadillos
const estadilloDiv = document.getElementById("estadillo-div");

// Elementos formulario de GSI
const formGsiDiv = document.getElementById("form-gsi-div");
const formGsi = document.getElementById("form-gsi");
const formFileInput = document.getElementById("formFile");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const submitGsiButton = document.getElementById("submit-gsi");

// Elementos tablas GSI
const resultGsiDiv = document.getElementById("result-gsi");
const tablesGsiDiv = document.getElementById("tables-gsi");
const generateReportButton = document.getElementById("generate-report-button-div");

// Elementos tablas reporte
const resultReportDiv = document.getElementById("result-report");
const tablesReportDiv = document.getElementById("tables-report");
const generateCsvButton = document.getElementById("generate-csv-button-div");

// Elementos progress bar
const progressBarDiv = document.getElementById("progress-bar");

export async function fetchReport(url, method, header, body) {
    const gsi = body.gsi;
    const uniqueNames = gsi.getUniqueNamesAllItineraries();
    console.log(uniqueNames);

    prepareLayout(
        [estadilloDiv, formGsiDiv, resultGsiDiv],
        [progressBarDiv]
    ) 

    const response = await fetch(url, {
        method: method,
        headers: header,
        body: JSON.stringify(uniqueNames)
    });

    if (response.ok) {
        const data = await response.json();
        console.log(data);
        gsi.setLinesReport(data.lineas_reporte);
        console.log(gsi);

        prepareLayout(
            [alertSuccessDiv, alertDangerDiv, estadilloDiv, formGsiDiv, resultGsiDiv, progressBarDiv],
            [resultReportDiv, tablesReportDiv, generateCsvButton]
        );

        gsi.itineraries.filter(itinerary => !itinerary.isDiscarded).forEach(itinerary => {
            const itineraryElement = createElement('div', 'itinerary-' + itinerary.numItinerario, ['container'], tablesReportDiv, '');
            const titleElement = createElement('h3', 'title-' + itinerary.numItinerario, ['mt-3'], itineraryElement, 'Itinerario ' + itinerary.numItinerario);

            const reportTable = {
                'tableDivElement': {'id': 'table-div-' + itinerary.numItinerario, 'classes': ['table-responsive']},
                'tableElement': {'id': 'table-' + itinerary.numItinerario, 'classes': ['table', 'table-hover', 'table-dark', 'mt-3']},
                'theadElement': {'id': 'thead-' + itinerary.numItinerario, 'classes': []},
                'trHeadElement': {'id': 'tr-head-' + itinerary.numItinerario, 'classes': ['table-primary', 'text-nowrap'], 'headerLine': Object.keys(itinerary.linesReport[0].toOrderedObject())},
                'tbodyElement': {'id': 'tbody-' + itinerary.numItinerario, 'classes': []},
                'lines': itinerary.getLinesReport(),
                'linesHaveButton': true
            };
            buildTable(reportTable, itineraryElement);
        });
    } else {
        showAlertDanger(alertDangerDiv, alertDangerP, "Error al generar el reporte:\n" + response.status + " " + response.statusText);
    }
}