import { prepareLayout, buildTable, createButtonsGroup, createElement } from "./global_utils.js";


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


export function fetchCsv(gsi) {
    console.log(gsi);

    const allLinesCsv = gsi.itineraries.filter(itinerary => !itinerary.isDiscarded).flatMap(itinerary => {
        itinerary.setLinesCsv();
        return itinerary.linesCsv;
    });
    console.log(allLinesCsv);
    const csvTable = {
        'tableDivElement': { 'id': 'csv-table-div', 'classes': ['table-responsive'] },
        'tableElement': { 'id': 'csv-table', 'classes': ['table', 'table-hover', 'table-dark', 'mt-3'] },
        'theadElement': { 'id': 'csv-thead', 'classes': [] },
        'trHeadElement': { 'id': 'csv-tr-head', 'classes': ['table-primary', 'text-nowrap'], 'headerLine':  Object.keys(allLinesCsv[0].toOrderedObject())},
        'tbodyElement': { 'id': 'csv-tbody', 'classes': [] },
        'lines': allLinesCsv,
        'linesHaveButton': false
    };
    prepareLayout(
        [alertDangerDiv, alertSuccessDiv, estadilloDiv, formGsiDiv, resultGsiDiv, resultReportDiv, progressBarDiv],
        [resultCsvDiv]
    )
    buildTable(csvTable, tablesCsvDiv);

    const blob = new Blob([allLinesCsv.map(line => line.toString()).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const sendCsvButtonObject = {
        'id': 'group-buttons-send-csv',
        'classes': ['btn-group', 'm-3'],
        'attributes': { 'role': 'group' },
        'buttons': [
            {
                'id': 'button-send-csv',
                'classes': ['btn', 'btn-lg', 'btn-success'],
                'attributes': { 'type': 'button' },
                'events': [
                    {
                        'name': 'click',
                        'function': () => {
                            prepareLayout(
                                [alertDangerDiv, alertSuccessDiv, estadilloDiv, formGsiDiv, resultGsiDiv, resultReportDiv, resultCsvDiv],
                                [progressBarDiv]
                            );
                            sendCsvByFtp(blob);
                        }
                    }
                ],
                'text': 'Enviar CSV a TD'
            },
            {
                'id': 'button-download-csv',
                'classes': ['btn', 'btn-lg', 'btn-primary'],
                'attributes': { 'type': 'button' },
                'events': [
                    {
                        'name': 'click',
                        'function': () => {
                            console.log('Descargar CSV');
                            const link = document.createElement('a');
                            const url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', `csv_${gsi.file.name}_${Date.now()}.csv`);
                            link.style.visibility = 'hidden';
                            link.click();
                        }
                    }
                ],
                'text': 'Descargar CSV'
            }
        ]
    };
    createButtonsGroup(sendCsvButtonObject, sendCsvButton);
}


async function sendCsvByFtp(blob) {
    const response = await fetch(urlEnviarCsv, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/csv;charset=utf-8;'
        },
        body: blob
    });

    if (response.ok) {
        const data = await response.text();
        console.log(data);
        if (data === 'OK') {
            prepareLayout(
                [progressBarDiv],
                [alertSuccessDiv]
            )
            alertSuccessP.innerHTML = 'CSV enviado correctamente';
            createElement('a', '', [], alertSuccessDiv, '\nVolver al inicio', {'href': urlHome});
        } else {
            prepareLayout(
                [progressBarDiv],
                [alertDangerDiv]
            )
            alertDangerP.innerHTML = 'Error al enviar el CSV: \n' + response.statusText;
            createElement('a', '', [], alertDangerDiv, '\nVolver al inicio', {'href': urlHome});
        }
    }
}
