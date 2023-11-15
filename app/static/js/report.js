// Autor: Joan Marín

// Importar módulos
import { showAlertDanger, showAlertSuccess, createElement, prepareLayout, buildTable, createButtonsGroup } from "./global_utils.js";
import { fetchCsv } from "./csv.js";

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

// Elementos tabla csv
const resultCsvDiv = document.getElementById("result-csv");
const tablesCsvDiv = document.getElementById("tables-csv");
const sendCsvButton = document.getElementById("send-csv-button-div");

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

            // const linesReport = itinerary.getLinesReport();

            if (itinerary.linesReport.length > 0) {
                const titleElement = createElement('h3', 'title-' + itinerary.numItinerario, ['mt-3'], itineraryElement, 'Itinerario ' + itinerary.numItinerario);

                const reportTable = {
                    'tableDivElement': { 'id': 'table-div-' + itinerary.numItinerario, 'classes': ['table-responsive'] },
                    'tableElement': { 'id': 'table-' + itinerary.numItinerario, 'classes': ['table', 'table-hover', 'table-dark', 'mt-3'] },
                    'theadElement': { 'id': 'thead-' + itinerary.numItinerario, 'classes': [] },
                    'trHeadElement': { 'id': 'tr-head-' + itinerary.numItinerario, 'classes': ['table-primary', 'text-nowrap'], 'headerLine': Object.keys(itinerary.linesReport[0].toOrderedObject())},
                    'tbodyElement': { 'id': 'tbody-' + itinerary.numItinerario, 'classes': [] },
                    'lines': itinerary.linesReport,
                    'linesHaveButton': true, 
                    'functionButton': () => {
                        if (itinerary.linesReport.every(line => line.isDiscarded)) {
                            itinerary.isDiscarded = true;
                            titleElement.remove();
                        }
                        if (gsi.itineraries.every(itinerary => itinerary.isDiscarded)) {
                            generateCsvButton.remove();
                        }
                    }
                };
                buildTable(reportTable, itineraryElement);
            }

            itinerary.setLinesGsiInx();
            // const linesInx = itinerary.getLinesGsiInx();
            console.log(itinerary.linesGsiInx);

            if (itinerary.linesGsiInx.length > 0) {
                const titleElementInx = createElement('h3', 'title-inx-' + itinerary.numItinerario, ['mt-3'], itineraryElement, 'Nombres de campo no encontrados en la base de datos - Itinerario ' + itinerary.numItinerario);

                const downloadInxButtonObject = {
                    'id': 'group-buttons-gsi-inx-' + itinerary.numItinerario,
                    'classes': ['btn-group', 'm-3'],
                    'attributes': { 'role': 'group' },
                    'buttons': [
                        {
                            'id': 'button-download-inx-' + itinerary.numItinerario,
                            'classes': ['btn', 'btn-lg', 'btn-primary'],
                            'attributes': { 'type': 'button' },
                            'events': [
                                {
                                    'name': 'click',
                                    'function': () => {
                                        const blob = new Blob([itinerary.linesGsiInx.map(line => line.toString()).join('\n')], { type: 'text/csv;charset=utf-8;' });
                                        const link = document.createElement('a');
                                        const url = URL.createObjectURL(blob);
                                        link.setAttribute('href', url);
                                        link.setAttribute('download', 'nombres_campo_inexistentes.csv');
                                        link.style.visibility = 'hidden';
                                        link.click();
                                    }
                                }
                            ],
                            'text': 'Descargar CSV nombres de campo inexistentes'
                        }
                    ]
                };
                const downloadInxButtonDiv = createElement('div', 'download-inx-button-div-' + itinerary.numItinerario, ['d-grid', 'gap-2'], itineraryElement);
                const downloadInxButton = createButtonsGroup(downloadInxButtonObject, downloadInxButtonDiv);

                const inxTable = {
                    'tableDivElement': { 'id': 'inx-table-div-' + itinerary.numItinerario, 'classes': ['table-responsive'] },
                    'tableElement': { 'id': 'inx-table-' + itinerary.numItinerario, 'classes': ['table', 'table-hover', 'table-dark', 'mt-3'] },
                    'theadElement': { 'id': 'inx-thead-' + itinerary.numItinerario, 'classes': [] },
                    'trHeadElement': { 'id': 'inx-tr-head-' + itinerary.numItinerario, 'classes': ['table-primary', 'text-nowrap'], 'headerLine': Object.keys(itinerary.linesGsiInx[0].toOrderedObject()) },
                    'tbodyElement': { 'id': 'inx-tbody-' + itinerary.numItinerario, 'classes': [] },
                    'lines': itinerary.linesGsiInx,
                    'linesHaveButton': false
                };
                buildTable(inxTable, itineraryElement);
            }
        });

        if (gsi.itineraries.filter(itinerary => !itinerary.isDiscarded && itinerary.linesReport.length > 0).length > 0) {
            const generateCsvButtonObject = {
                'id': 'group-buttons-generate-csv',
                'classes': ['btn-group', 'm-3'],
                'attributes': { 'role': 'group' },
                'buttons': [
                    {
                        'id': 'button-generate-csv',
                        'classes': ['btn', 'btn-lg', 'btn-success'],
                        'attributes': { 'type': 'button' },
                        'events': [
                            {
                                'name': 'click',
                                'function': () => {
                                    prepareLayout(
                                        [alertSuccessDiv, alertDangerDiv, estadilloDiv, formGsiDiv, resultGsiDiv, resultReportDiv, resultCsvDiv],
                                        [progressBarDiv]
                                    )
                                    fetchCsv(gsi);
                                }
                            }
                        ],
                        'text': 'Generar CSV'
                    }
                ]
            };
            createButtonsGroup(generateCsvButtonObject, generateCsvButton);
        }
    } else {
        showAlertDanger(alertDangerDiv, alertDangerP, "Error al generar el reporte:\n" + response.status + " " + response.statusText);
    }
}