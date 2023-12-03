// Autor: Joan Marín

// Importar módulos
import { showAlertDanger, showAlertSuccess, createElement, prepareLayout, buildTable, createButtonsGroup, createRadioButtonsGroup } from "./global_utils.js";
import { processGsi, createCardsGroup, getPresas, getSensoresLista, getEstadillo } from "./home_utils.js";
import { fetchReport } from "./report.js";


// Descargar reporte

// Tabla interactiva con ordenación, borrado, edición, exportación. https://bootstrap-table.com/

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


// Construir el acordeón con las listas de estadillos cuando cargue la página
document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch(urlDescargarEstadillos, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    
    if (response.ok) {
        const listasEstadillos = await response.json();
        console.log(listasEstadillos);

        const diccionarioTramos = {
            '62': 'Tramo 3',
            '64': 'Tramo 4',
            '65': 'Etapa 1A',
            '66': 'Etapa 1B',
            '67': 'Ramal L4',
            '70': 'Tramo 2'
        }

        createElement('h4', 'estadillo-title', ['mt-3'], estadilloDiv, 'Selecciona una lista para generar el estadillo de campo: ', {});

        const idRioUnicos = new Set([...listasEstadillos.map(lista => lista.id_rio)]);
        console.log(idRioUnicos);

        idRioUnicos.forEach(idRio => {
            const presasRio = getPresas(listasEstadillos, idRio);
            console.log(presasRio);

            const accordionItem = createElement('div', 'accordion-item-' + idRio, ['accordion-item'], estadilloDiv, '', {});
            const accordionHeader = createElement('h2', 'accordion-header-' + idRio, ['accordion-header'], accordionItem, '', {});
            const button = createElement('button', 'accordion-header-button' + idRio, ['accordion-button'], accordionHeader, diccionarioTramos[idRio], {
                'type': 'button',
                'data-bs-toggle': 'collapse',
                'data-bs-target': '#accordion-collapse-' + idRio,
                'aria-expanded': 'false',
                'aria-controls': 'accordion-collapse-' + idRio
            });
            const accordionCollapse = createElement('div', 'accordion-collapse-' + idRio, ['accordion-collapse', 'collapse'], accordionItem, '', {
                'aria-labelledby': 'accordion-header-' + idRio,
                'data-bs-parent': '#estadillo-div'
            });
            const accordionBody = createElement('div', 'accordion-body-' + idRio, ['accordion-body'], accordionCollapse, '', {});

            const listasRioGroup = createElement('ul', 'listas-rio-group-' + idRio, ['list-group'], accordionBody, '', {});
            presasRio.forEach(presa => {
                const listaRioItem = createElement('li', 'lista-rio-item-' + presa, ['list-group-item', 'd-flex', 'flex-column'], listasRioGroup, '', {});
                const listaRioItemStrong = createElement('strong', 'lista-rio-item-strong-' + presa, [], listaRioItem, presa, {});
                listasEstadillos.filter(lista => lista.nom_presa === presa).forEach(lista => {
                    const listaRioItemLink = createElement('a', 'lista-rio-item-link-' + lista.nom_lista, ['btn', 'btn-outline-primary', 'btn-sm', 'm-1'], listaRioItem, lista.nom_lista, {});
                    listaRioItemLink.addEventListener('click', () => {
                        console.log(lista);
                        const url = urlGetSensorsLista.replace('0', lista.id_lista);
                        const sensoresLista = getSensoresLista(url)
                        .then(sensoresLista => {
                            console.log(sensoresLista);
                            const estadillo = getEstadillo(lista, sensoresLista);
                            console.log(estadillo);
                            // estadillo.getPdf();
                        })
                        .catch(error => {
                            showAlertDanger(alertDangerDiv, alertDangerP,'No se han podido obtener los sensores de la lista: ' + error);
                        });
                    });
                });
            });
        });
    } else {
        showAlertDanger(alertDangerDiv, alertDangerP, "Error al cargar las listas de estadillos.\n" + response.status + " " + response.statusText + ".");
    }
});


// Capturar evento submit del formulario GSI
submitGsiButton.addEventListener("click", (event) => {
    event.preventDefault();

    // Capturar datos del formulario
    const file = formFileInput.files[0];

    // Verificar que se haya seleccionado un archivo
    if (file == undefined) {
        showAlertDanger(alertDangerDiv, alertDangerP, "No se ha seleccionado ningún archivo.");
        return;
    }

    // Verificar que sea un archivo gsi
    if (file.name.toLowerCase().split('.').pop() != "gsi") {
        showAlertDanger(alertDangerDiv, alertDangerP, "El archivo no es un GSI.");
        return;
    }

    // Verificar que el tamaño del archivo no sea 0
    if (file.size == 0) {
        showAlertDanger(alertDangerDiv, alertDangerP, "El archivo está vacío.");
        return;
    }

    // Verificar que la fecha y hora sean válidas
    const date = dateInput.value;
    const time = timeInput.value;
    const datetime = new Date(date + " " + time);
    
    if (isNaN(datetime.getDate())) {
        showAlertDanger(alertDangerDiv, alertDangerP, "Fecha y hora no válidas.");
        return;
    }

    if (datetime > new Date()) {
        showAlertDanger(alertDangerDiv, alertDangerP, "Fecha y hora no válidas. No se puede seleccionar una fecha futura.");
        return;
    }

    // Preparar el layout de la página
    prepareLayout(
        [alertSuccessDiv, alertDangerDiv, estadilloDiv, formGsiDiv, progressBarDiv],
        [resultGsiDiv]
    )

    // Procesar el GSI
    const gsi = processGsi(file, datetime)
        .then(gsi => {
            console.log(gsi);
            gsi.itineraries.forEach(itinerary => {
                const itineraryElement = createElement('div', 'itinerary-' + itinerary.numItinerario, ['container'], tablesGsiDiv, '');
                const titleElement = createElement('h3', 'title-' + itinerary.numItinerario, ['mt-3'], itineraryElement, 'Itinerario ' + itinerary.numItinerario);
                const cardsGroup = {
                    'id': 'cards-gsi-' + itinerary.numItinerario,
                    'classes': ['card-group'],
                    'attributes': {},
                    'cards': [
                        {
                            'id': 'card-dist-total-' + itinerary.numItinerario,
                            'classes': ['card', 'text-white', 'bg-primary', 'm-3'],
                            'attributes': {},
                            'header': {'classes': ['card-header'], 'text': 'Distancia total'},
                            'body': {
                                'classes': ['card-body'],
                                'title': {'classes': ['card-title'], 'text': ''},
                                'text': {'classes': ['card-text'], 'text': itinerary.distTotal.toFixed(4) + ' m'}
                            }
                        }, 
                        {
                            'id': 'card-tolerancia-' + itinerary.numItinerario,
                            'classes': ['card', 'text-white', 'bg-primary', 'm-3'],
                            'attributes': {},
                            'header': {'classes': ['card-header'], 'text': 'Tolerancia'},
                            'body': {
                                'classes': ['card-body'],
                                'title': {'classes': ['card-title'], 'text': ''},
                                'text': {'classes': ['card-text'], 'text': itinerary.tolerancia.toFixed(4) + ' mm/Km'}
                            }
                        },
                        {
                            'id': 'card-error-cierre-' + itinerary.numItinerario,
                            'classes': ['card', 'text-white', 'bg-primary', 'm-3'],
                            'attributes': {},
                            'header': {'classes': ['card-header'], 'text': 'Error de cierre'},
                            'body': {
                                'classes': ['card-body'],
                                'title': {'classes': ['card-title'], 'text': ''},
                                'text': {'classes': ['card-text'], 'text': itinerary.errorDeCierre.toFixed(4) + ' mm'}
                            }
                        },
                        {
                            'id': 'card-error-km-' + itinerary.numItinerario,
                            'classes': ['card', 'text-white', 'bg-primary', 'm-3'],
                            'attributes': {},
                            'header': {'classes': ['card-header'], 'text': 'Error Km'},
                            'body': {
                                'classes': ['card-body'],
                                'title': {'classes': ['card-title'], 'text': ''},
                                'text': {'classes': ['card-text'], 'text': itinerary.errorKm.toFixed(4) + ' mm/Km'}
                            }
                        }
                    ]
                };
                if (itinerary.errorKm > itinerary.tolerancia) {
                    const cardErrorCierre = cardsGroup.cards.filter(card => card.id == 'card-error-cierre-' + itinerary.numItinerario);
                    cardErrorCierre[0].classes.splice(cardErrorCierre[0].classes.indexOf('bg-primary'), 1);
                    cardErrorCierre[0].classes.push('bg-danger');

                    const cardErrorKm = cardsGroup.cards.filter(card => card.id == 'card-error-km-' + itinerary.numItinerario);
                    cardErrorKm[0].classes.splice(cardErrorKm[0].classes.indexOf('bg-primary'), 1);
                    cardErrorKm[0].classes.push('bg-danger');
                }
                createCardsGroup(cardsGroup, itineraryElement);

                const descartarButton = {
                    'id': 'button-descartar-group-' + itinerary.numItinerario,
                    'classes': ['btn-group', 'm-3'],
                    'attributes': {'role': 'group'},
                    'buttons': [
                        {
                            'id': 'button-descartar-' + itinerary.numItinerario,
                            'classes': ['btn', 'btn-lg', 'btn-outline-danger'],
                            'attributes': {'type': 'button'},
                            'text': 'Descartar', 
                            'events': [{'name': 'click', 'function': () => {
                                itineraryElement.remove();
                                itinerary.isDiscarded = true;
                                if (gsi.itineraries.every(itinerary => itinerary.isDiscarded === true)) {
                                    document.location.reload();
                                }
                            }}]
                        }
                    ]
                };
                createButtonsGroup(descartarButton, itineraryElement);

                const compensarRadioButtons = {
                    'id': 'button-compensar-group-' + itinerary.numItinerario,
                    'classes': ['btn-group', 'm-3'],
                    'attributes': {'role': 'group', 'aria-label': 'Basic radio toggle button group'},
                    'buttons': [
                        {
                            'input': {
                                'type-element': 'input',
                                'id': 'button-compensar-anillo-' + itinerary.numItinerario,
                                'classes': ['btn-check'],
                                'attributes': {'type': 'radio', 'name': 'compensar-' + itinerary.numItinerario, 'autocomplete': 'off', 'checked': ''},
                                'events': [{'name': 'click', 'function': () => {
                                    const errorCierreCard = document.getElementById('card-error-cierre-' + itinerary.numItinerario);
                                    const errorKmCard = document.getElementById('card-error-km-' + itinerary.numItinerario);
                                    prepareLayout([], [errorCierreCard, errorKmCard])
                                    itinerary.setCompensation(true);
                                    const tableDivElement = document.getElementById('table-div-' + itinerary.numItinerario);
                                    if (tableDivElement) {
                                        console.log(tableDivElement);
                                        tableDivElement.remove();
                                        const gsiTable = {
                                            'tableDivElement': {'id': 'table-div-' + itinerary.numItinerario, 'classes': ['table-responsive']},
                                            'tableElement': {'id': 'table-' + itinerary.numItinerario, 'classes': ['table', 'table-hover', 'table-dark', 'mt-3']},
                                            'theadElement': {'id': 'thead-' + itinerary.numItinerario, 'classes': []},
                                            'trHeadElement': {'id': 'tr-head-' + itinerary.numItinerario, 'classes': ['table-primary'], 'headerLine': itinerary.headerTable},
                                            'tbodyElement': {'id': 'tbody-' + itinerary.numItinerario, 'classes': []},
                                            'lines': itinerary.linesGsi,
                                            'linesHaveButton': false
                                        };
                                        buildTable(gsiTable, itineraryElement);
                                    }
                                }}]
                            },
                            'label': {
                                'type-element': 'label',
                                'classes': ['btn', 'btn-outline-primary', 'btn-lg'],
                                'attributes': {'for': 'button-compensar-anillo-' + itinerary.numItinerario},
                                'text': 'Compensar anillo'
                            }
                        },
                        {
                            'input': {
                                'type-element': 'input',
                                'id': 'button-no-compensar-' + itinerary.numItinerario,
                                'classes': ['btn-check'],
                                'attributes': {'type': 'radio', 'name': 'compensar-' + itinerary.numItinerario, 'autocomplete': 'off'},
                                'events': [{'name': 'click', 'function': () => {
                                    const errorCierreCard = document.getElementById('card-error-cierre-' + itinerary.numItinerario);
                                    const errorKmCard = document.getElementById('card-error-km-' + itinerary.numItinerario);
                                    prepareLayout([errorCierreCard, errorKmCard], []);
                                    itinerary.setCompensation(false);
                                    const tableDivElement = document.getElementById('table-div-' + itinerary.numItinerario);
                                    if (tableDivElement) {
                                        console.log(tableDivElement);
                                        tableDivElement.remove();
                                        const gsiTable = {
                                            'tableDivElement': {'id': 'table-div-' + itinerary.numItinerario, 'classes': ['table-responsive']},
                                            'tableElement': {'id': 'table-' + itinerary.numItinerario, 'classes': ['table', 'table-hover', 'table-dark', 'mt-3']},
                                            'theadElement': {'id': 'thead-' + itinerary.numItinerario, 'classes': []},
                                            'trHeadElement': {'id': 'tr-head-' + itinerary.numItinerario, 'classes': ['table-primary'], 'headerLine': itinerary.headerTable},
                                            'tbodyElement': {'id': 'tbody-' + itinerary.numItinerario, 'classes': []},
                                            'lines': itinerary.linesGsi,
                                            'linesHaveButton': false
                                        };
                                        buildTable(gsiTable, itineraryElement);
                                    }
                                }}]
                            },
                            'label': {
                                'type-element': 'label',
                                'classes': ['btn', 'btn-outline-primary', 'btn-lg'],
                                'attributes': {'for': 'button-no-compensar-' + itinerary.numItinerario},
                                'text': 'No compensar'
                            }
                        }
                    ]
                };
                createRadioButtonsGroup(compensarRadioButtons, itineraryElement);

                const gsiTable = {
                    'tableDivElement': {'id': 'table-div-' + itinerary.numItinerario, 'classes': ['table-responsive']},
                    'tableElement': {'id': 'table-' + itinerary.numItinerario, 'classes': ['table', 'table-hover', 'table-dark', 'mt-3']},
                    'theadElement': {'id': 'thead-' + itinerary.numItinerario, 'classes': []},
                    'trHeadElement': {'id': 'tr-head-' + itinerary.numItinerario, 'classes': ['table-primary'], 'headerLine': Object.keys(itinerary.linesGsi[0].toOrderedObject())},
                    'tbodyElement': {'id': 'tbody-' + itinerary.numItinerario, 'classes': []},
                    'lines': itinerary.linesGsi,
                    'linesHaveButton': false
                };
                buildTable(gsiTable, itineraryElement);
            });

            const groupButtons = {
                'id': 'group-buttons-gsi',
                'classes': ['btn-group', 'm-3'],
                'attributes': { 'role': 'group' },
                'buttons': [
                    {
                        'id': 'button-create-report',
                        'classes': ['btn', 'btn-lg', 'btn-success'],
                        'attributes': { 'type': 'button' },
                        'events': [
                            {
                                'name': 'click',
                                'function': () => {
                                    fetchReport(urlHome, 'POST', {'content-type': 'application/json'}, {'gsi': gsi});
                                }
                            }
                        ],
                        'text': 'Generar reporte'
                    }
                ]
            };
            if (gsi.itineraries.length > 0 && gsi.itineraries.some(itinerary => itinerary.isDiscarded === false)) {
                createButtonsGroup(groupButtons, generateReportButton);
            }
        })
        .catch(error => {
            showAlertDanger(alertDangerDiv, alertDangerP, error);
        });
});

