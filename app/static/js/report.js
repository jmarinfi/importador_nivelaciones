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
    } else {
        showAlertDanger(alertDangerDiv, alertDangerP, "Error al generar el reporte:\n" + response.status + " " + response.statusText);
    }
}