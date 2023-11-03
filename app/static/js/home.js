console.log("home.js loaded");

// Verificaciones fecha formulario

// Descargar reporte

// Tabla interactiva con ordenación, borrado, edición, exportación. https://bootstrap-table.com/

// Elementos de avisos
const alertSuccessDiv = document.getElementById("alert-success");
const alertDangerDiv = document.getElementById("alert-danger");

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
const generateReportButton = document.getElementById("generate-report-button");

// Elementos progress bar
const progressBarDiv = document.getElementById("progress-bar");


// Capturar evento submit del formulario GSI
submitGsiButton.addEventListener("click", (event) => {});