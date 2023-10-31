// Componentes principales
const estadilloDiv = document.getElementById('estadillo-div');
const formGsiDiv = document.getElementById('form-gsi-div');
const resultGsiDiv = document.getElementById('result-gsi');
const resultGsiTablesDiv = document.getElementById('tables-gsi');
const resultReportDiv = document.getElementById('result-report');
const resultReportTablesDiv = document.getElementById('tables-report');
const resultCsvDiv = document.getElementById('result-csv');
const resultCsvTablesDiv = document.getElementById('tables-csv');
const progressBarDiv = document.getElementById('progress-bar');

// Elementos accionables
const submitGsiButton = document.getElementById('submit-gsi');
const generateReportButton = document.getElementById('generate-report-button');
const generateCsvButton = document.getElementById('generate-csv-button');
const downloadCsvButton = document.getElementById('download-csv-button');
const sendCsvButton  = document.getElementById('send-csv-button');

// Elementos de formulario
const formGsi = document.getElementById('form-gsi');

// Elementos de alerta
const alertSuccessDiv = document.getElementById('alert-success');
const alertDangerDiv = document.getElementById('alert-danger');
const alertSuccessText = document.getElementById('alert-success-text');
const alertDangerText = document.getElementById('alert-danger-text');

// Urls de los endpoints
urlHome;
urlEnviarCsv;

// Constantes
const REGEXGSI = /([0-9]{2}[0-9.])([0-9.]{3})([+\-])([^\s]{8,16})\s/g;
WI_NEW_ITINERARY = '410';
WI_NEW_LINE = '110';
WI_DIST_MIRA = '32';
WI_COTA = '83';
WI_ESPALDA = '331';
WI_FRENTE = '332';
WI_RADIADO = '333';
WI_MED_REP = '390';
WI_DESV_EST = '391';
WI_MEDIANA = '392';
WI_BALANCE = '573';
WI_DIST_TOTAL = '574';


submitGsiButton.addEventListener('click', capturarGsi);


async function capturarGsi(event) {
    event.preventDefault();
    const formData = new FormData(formGsi);
    const file = formData.get('formFile');

    if (file.size === 0) {
        alertDangerDiv.classList.remove('d-none');
        alertDangerText.textContent = 'No se ha seleccionado ningún archivo';
        return;
    }

    const date = formData.get('dateInput');
    const time = formData.get('timeInput');
    const datetime = new Date(date + ' ' + time);

    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = async function (evt) {
        const rawContent = evt.target.result;
        const itinerariosGsi = procesarGsi(rawContent, datetime);
        
        console.log(itinerariosGsi);

        estadilloDiv.classList.add('d-none');
        formGsiDiv.classList.add('d-none');
        resultGsiDiv.classList.remove('d-none');
        if (!alertDangerDiv.classList.contains('d-none')) {
            alertDangerDiv.classList.add('d-none');
        }
        if (!alertSuccessDiv.classList.contains('d-none')) {
            alertSuccessDiv.classList.add('d-none');
        }

        for (let itinerario of itinerariosGsi) {
            itinerario = crearTablaGsi(itinerario, itinerariosGsi, resultGsiTablesDiv, 'gsi', itinerario.compensar);
        }

        resultGsiTablesDiv.addEventListener('change', function (event) {
            if (event.target.type === 'checkbox') {
                const numItinerario = event.target.id.split('-')[1];
                console.log(numItinerario);
                let itinerario = itinerariosGsi.find(itinerario => itinerario.itinerario === parseInt(numItinerario));
                itinerario.compensar = event.target.checked;
                console.log(itinerario);
                resultGsiTablesDiv.innerHTML = '';
                for (let itinerario of itinerariosGsi) {
                    itinerario = crearTablaGsi(itinerario, itinerariosGsi, resultGsiTablesDiv, 'gsi', itinerario.compensar);
                }
            }
        });

        generateReportButton.addEventListener('click', async function (event) {
            mostrarProgressBar();

            const nomCampoUnicos = [...new Set(itinerariosGsi.map(itinerario => itinerario.lineas_gsi.map(linea => linea.nom_campo)).flat())];

            console.log(nomCampoUnicos);

            const response = await fetch(urlHome, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nomCampoUnicos),
            });

            if (response.ok) {
                let data = await response.json();
                console.log(data);

                mostrarReporte();

                if (data.lineas_reporte.length > 0) {
                    data.lineas_reporte.forEach(linea => {
                        const lineaGsi = itinerariosGsi.map(itinerario => itinerario.lineas_gsi).flat().find(lineaGsi => lineaGsi.nom_campo === linea.nom_campo && lineaGsi.cota_comp);
                        linea.linea_gsi = lineaGsi;
                        linea.cota = lineaGsi.cota;
                        linea.itinerario = lineaGsi.itinerario;
                        linea.fecha = formatDate(new Date(itinerariosGsi[0].fecha));
                        linea.cota_comp = lineaGsi.cota_comp;
                        linea.medida = getMedida(linea.cota_comp, linea.lect_ref, linea.medida_ref);
                        linea.dif_ult_med = linea.medida - getMedida(linea.ult_lect, linea.lect_ref, linea.medida_ref);
                        linea.dif_penult_med = linea.medida - getMedida(linea.penult_lect, linea.lect_ref, linea.medida_ref);
                        linea.dif_antepenult_med = linea.medida - getMedida(linea.antepenult_lect, linea.lect_ref, linea.medida_ref);
                        linea.fecha_ref = formatDate(new Date(new Date(linea.fecha_ref)));
                    });

                    data = crearTablaGsi(data, null, resultReportTablesDiv, 'report');

                } else {
                    alertDangerDiv.classList.remove('d-none');
                    alertDangerText.textContent = 'No se encontraron datos en la base de datos';
                    generateCsvButton.classList.add('d-none');
                }

                const nomCampoResponse = data.lineas_reporte.map(linea => linea.nom_campo);
                const idsInexistentes = itinerariosGsi.map(itinerario => itinerario.lineas_gsi).flat().filter(linea => !nomCampoResponse.includes(linea.nom_campo) && linea.cota_comp).map(linea => linea.nom_campo);
                console.log(nomCampoResponse);
                console.log(idsInexistentes);

                if (idsInexistentes.length > 0) {
                    const lineasInexistentes = itinerariosGsi.map(itinerario => itinerario.lineas_gsi).flat().filter(linea => idsInexistentes.includes(linea.nom_campo) && linea.cota_comp);
                    lineasInexistentes.forEach(linea => {linea.fecha = formatDate(new Date(itinerariosGsi[0].fecha))});
                    console.log(lineasInexistentes);

                    let dataInexistentes = {
                        'lineas_reporte': lineasInexistentes,
                    };
                    dataInexistentes = crearTablaGsi(dataInexistentes, null, resultReportTablesDiv, 'report-inexistentes');
                    const buttonDescargarInexistentes = document.getElementById('btn-descargar-inexistentes');
                    buttonDescargarInexistentes.addEventListener('click', function (event) {
                        const blob = new Blob([buildCsv(dataInexistentes)], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `inexistentes.csv`);
                        link.style.visibility = 'hidden';
                        link.click();
                    });
                }

                generateCsvButton.addEventListener('click', async function (event) {
                    mostrarCsv();

                    data = crearTablaGsi(data, null, resultCsvTablesDiv, 'csv');

                    const csvText = buildCsv(data);

                    downloadCsvButton.addEventListener('click', async function (event) {
                        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `reporte.csv`);
                        link.style.visibility = 'hidden';
                        link.click();
                    });

                    sendCsvButton.addEventListener('click', async function (event) {
                        mostrarProgressBar();
                        const response = await fetch(urlEnviarCsv, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'text/csv;charset=utf-8;',
                            },
                            body: csvText,
                        });

                        if (response.ok) {
                            const data = await response.text();
                            if (data === 'OK') {
                                progressBarDiv.classList.add('d-none');
                                alertSuccessDiv.classList.remove('d-none');
                                alertSuccessText.textContent = 'CSV enviado correctamente.\n';
                                // Añadir enlace al inicio en el mensaje de éxito
                                const link = document.createElement('a');
                                link.setAttribute('href', urlHome);
                                link.textContent = 'Volver al inicio';
                                alertSuccessText.appendChild(link);

                            } else {
                                progressBarDiv.classList.add('d-none');
                                alertDangerDiv.classList.remove('d-none');
                                alertDangerText.textContent = 'No se ha podido enviar el CSV al servidor. Vuelve a intentarlo o descárgalo e impórtalo manualmente.\n' + response.statusText + '\n';
                                const link = document.createElement('a');
                                link.setAttribute('href', urlHome);
                                link.textContent = 'Volver al inicio';
                                alertDangerText.appendChild(link);
                            }
                        } else {
                            alertDangerDiv.classList.remove('d-none');
                            alertDangerText.textContent = 'Error al enviar los datos\n' + response.statusText;
                        }
                    });
                });
            } else {
                alertDangerDiv.classList.remove('d-none');
                alertDangerText.textContent = 'Error al obtener los datos del servidor\n' + response.statusText;
                document.location.href = urlHome;
            }
        });
    }
}


function procesarGsi(rawContent, datetime) {
    const itinerariosGsi = [];
    let itinerarioActual = null;
    let lineaGsiActual = null;
    let itinerario = 0;
    let metodo = '';
    let distAcum = 0.0;
    const matches = rawContent.matchAll(REGEXGSI);

    for (const match of matches) {
        let [_, wordIndex, infCompl, sign, data] = match;
        [wordIndex, infCompl, sign, data] = [wordIndex, infCompl, sign, data].map(x => x.replace(/[?.]/g, ''));

        switch (wordIndex) {
            case WI_NEW_ITINERARY:
                itinerario += 1;
                metodo = data === '1' ? 'EF' : data === '2' ? 'EFFE' : data === '3' ? 'aEF' : data === '4' ? 'aEFFE' : data === '10' ? 'Comprob_y_ajuste' : 'Desconocido';
                itinerarioActual = {
                    'itinerario': itinerario,
                    'metodo': metodo,
                    'dist_acum': 0.0,
                    'fecha': datetime,
                    'error_de_cierre': 0.0,
                    'tolerancia': 0.0,
                    'error_km': 0.0,
                    'distancia_total': 0.0,
                    'compensar': true,
                    'lineas_gsi': [],
                };
                itinerariosGsi.push(itinerarioActual);
                break;

            case WI_NEW_LINE:
                if (lineaGsiActual && !lineaGsiActual.radiado && lineaGsiActual.dist_mira) {
                    distAcum += lineaGsiActual.dist_mira;
                    lineaGsiActual.dist_acum = distAcum;
                }
                lineaGsiActual = {
                    'metodo': itinerarioActual.metodo,
                    'itinerario': itinerarioActual.itinerario,
                    'nom_campo': data.replace(/^0+/, '') || '0',
                    'dist_mira': null,
                    'cota': null,
                    'espalda': null,
                    'frente': null,
                    'radiado': null,
                    'med_rep': null,
                    'desv_est': null,
                    'mediana': null,
                    'balance': null,
                    'dist_total': null,
                    'dist_acum': distAcum,
                    'cota_comp': null,
                };
                itinerarioActual.lineas_gsi.push(lineaGsiActual);
                break;

            case WI_DIST_MIRA:
                lineaGsiActual.dist_mira = parseFloat(sign + data) / 100000;
                break;

            case WI_COTA:
                lineaGsiActual.cota = parseFloat(sign + data) / 100000;
                break;

            case WI_ESPALDA:
                lineaGsiActual.espalda = parseFloat(sign + data) / 100000;
                break;

            case WI_FRENTE:
                lineaGsiActual.frente = parseFloat(sign + data) / 100000;
                break;

            case WI_RADIADO:
                lineaGsiActual.radiado = parseFloat(sign + data) / 100000;
                break;

            case WI_MED_REP:
                lineaGsiActual.med_rep = parseInt(sign + data);
                break;

            case WI_DESV_EST:
                lineaGsiActual.desv_est = parseInt(sign + data);
                break;
            
            case WI_MEDIANA:
                lineaGsiActual.mediana = parseInt(sign + data);
                break;

            case WI_BALANCE:
                lineaGsiActual.balance = parseFloat(sign + data) / 100000;
                break;

            case WI_DIST_TOTAL:
                lineaGsiActual.dist_total = parseFloat(sign + data) / 100000;
                break;
        
            default:
                break;
        }
    }

    itinerariosGsi.forEach(itinerario => {
        const lineasGsi = itinerario.lineas_gsi;
        const cotaInicial = lineasGsi.find(linea => linea.cota).cota;
        const cotaFinal = [...lineasGsi].reverse().find(linea => linea.cota).cota;
        itinerario.error_de_cierre = (cotaFinal - cotaInicial) * 1000;
        itinerario.distancia_total = lineasGsi[lineasGsi.length - 1].dist_acum;
        const sqrtDistTotal = Math.sqrt(itinerario.distancia_total / 1000);
        itinerario.error_km = Math.abs(itinerario.error_de_cierre / sqrtDistTotal);
        itinerario.tolerancia = 0.3 * sqrtDistTotal;
        lineasGsi.forEach(linea => {
            linea.cota_comp = linea.cota ? linea.cota - (linea.dist_acum * (itinerario.error_de_cierre / 1000) / itinerario.distancia_total) : null;
        });
    });

    return itinerariosGsi;
}


function crearTablaGsi(itinerario, itinerarios, parentDiv, tableType, checked = true) {
    const itinerarioContainerDiv = document.createElement('div');
    itinerarioContainerDiv.classList.add('container');
    parentDiv.appendChild(itinerarioContainerDiv);
    let itinerarioReturned = itinerario;
    if (tableType === 'gsi') {
        if (checked) {
            const cotaInicial = itinerarioReturned.lineas_gsi.find(linea => linea.cota).cota;
            const cotaFinal = [...itinerarioReturned.lineas_gsi].reverse().find(linea => linea.cota).cota;
            itinerarioReturned.error_de_cierre = (cotaFinal - cotaInicial) * 1000;
            itinerarioReturned.error_km = Math.abs(itinerarioReturned.error_de_cierre / Math.sqrt(itinerarioReturned.distancia_total / 1000));
            itinerarioReturned.lineas_gsi.forEach(linea => {
                linea.cota_comp = linea.cota ? linea.cota - (linea.dist_acum * (itinerarioReturned.error_de_cierre / 1000) / itinerarioReturned.distancia_total) : null;
            });
        } else {
            itinerarioReturned.error_de_cierre = 0.0;
            itinerarioReturned.error_km = 0.0;
            itinerarioReturned.lineas_gsi.forEach(linea => {
                linea.cota_comp = linea.cota;
            });
        }
    }
    

    const title = document.createElement('h3');
    title.classList.add('mt-3');
    let titleText = '';
    let numItinerario = 0;
    if (tableType === 'gsi') {
        numItinerario = itinerario.itinerario;
        textCompensado = checked ? 'con cotas compensadas' : 'con cotas sin compensar';
        titleText = `Itinerario ${numItinerario} ${textCompensado}`;
    } else if (tableType === 'report') {
        titleText = `Reporte de nivelación`;
    } else if (tableType === 'report-inexistentes') {
        titleText = `Nombres de campo no encontrados en la base de datos`;
    } else if (tableType === 'csv') {
        titleText = `CSV a enviar a la base de datos`;
    }
    title.textContent = titleText;
    itinerarioContainerDiv.appendChild(title);

    const cardsDiv = document.createElement('div');

    if (tableType === 'gsi') {
        // Se crean los elementos de las tarjetas
        cardsDiv.classList.add('card-group', 'mt-3');
        let  styles = ['card', 'text-white', 'bg-primary', 'm-3']
        createCard(cardsDiv, 'Distancia Total', itinerario.distancia_total.toFixed(5), styles);
        createCard(cardsDiv, 'Tolerancia', itinerario.tolerancia.toFixed(5), styles);
        if (checked) {
            if (Math.abs(itinerario.error_de_cierre) > itinerario.tolerancia) {
                styles = styles.filter(style => style !== 'bg-primary');
                styles.push('bg-danger');
            }
            createCard(cardsDiv, 'Error de Cierre', itinerario.error_de_cierre.toFixed(5), styles);
            createCard(cardsDiv, 'Error Km a Posteriori', itinerario.error_km.toFixed(5), styles);
        }
        
        itinerarioContainerDiv.appendChild(cardsDiv);
    }

    const switchDiv = document.createElement('div');

    // Se crea el switch para compensar o no las cotas
    if (tableType === 'gsi') {
        const switchFieldset = document.createElement('fieldset');

        switchFieldset.classList.add('form-group');
        const switchDivLegend = document.createElement('legend');
        switchDivLegend.classList.add('mt-4');
        switchDivLegend.textContent = 'Compensar cotas';
        switchFieldset.appendChild(switchDivLegend);

        const formSwitchDiv = document.createElement('div');
        formSwitchDiv.classList.add('form-check', 'form-switch');

        const inputSwitch = document.createElement('input');
        inputSwitch.classList.add('form-check-input');
        inputSwitch.type = 'checkbox';
        inputSwitch.id = `switch-${numItinerario}`;
        inputSwitch.checked = checked;
        formSwitchDiv.appendChild(inputSwitch);

        const labelSwitch = document.createElement('label');
        labelSwitch.classList.add('form-check-label');
        labelSwitch.htmlFor = `switch-${numItinerario}`;
        labelSwitch.textContent = 'Compensar';
        formSwitchDiv.appendChild(labelSwitch);

        switchFieldset.appendChild(formSwitchDiv);
        switchDiv.appendChild(switchFieldset);
        itinerarioContainerDiv.appendChild(switchDiv);
    }

    if (tableType === 'report-inexistentes') {
        const buttonDescargarInexistentes = document.createElement('button');
        buttonDescargarInexistentes.classList.add('btn', 'btn-lg', 'btn-primary', 'm-2');
        buttonDescargarInexistentes.innerText = 'Descargar cotas de nombres de campo no encontrados';
        buttonDescargarInexistentes.id = `btn-descargar-inexistentes`;
        buttonDescargarInexistentes.setAttribute('type', 'button');
        itinerarioContainerDiv.appendChild(buttonDescargarInexistentes);
    }

    // Se crean los elementos de la tabla
    const tablaDiv = document.createElement('div');
    tablaDiv.classList.add('table-responsive');
    const tabla = document.createElement('table');
    tabla.classList.add('table', 'table-hover', 'mt-3');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    tabla.appendChild(thead);
    tabla.appendChild(tbody);
    tablaDiv.appendChild(tabla);
    itinerarioContainerDiv.appendChild(tablaDiv);

    // Se crea el encabezado de la tabla
    const columnas = [];
    if (tableType === 'gsi') {
        columnas.push('METODO', 'ITINERARIO', 'NOM_CAMPO', 'DIST_MIRA', 'COTA', 'ESPALDA', 'FRENTE', 'RADIADO', 'MED_REP', 'DESV_EST', 'MEDIANA', 'BALANCE', 'DIST_TOTAL', 'DIST_ACUM', 'COTA_COMP');
    } else if (tableType === 'report') {
        columnas.push('ITINERARIO', 'NOM_CAMPO', 'NOM_SENSOR', 'COTA', 'COTA_COMP', 'DIF_ULT_MED', 'DIF_PENULT_MED', 'DIF_ANTEPENULT_MED');
    } else if (tableType === 'report-inexistentes') {
        columnas.push('FECHA', 'NOM_CAMPO', 'COTA_COMP');
    } else if (tableType === 'csv') {
        columnas.push('FECHA', 'NOM_SENSOR', 'COTA_COMP')
    }
    const trHead = document.createElement('tr');
    trHead.classList.add('table-primary');

    // Se crea el botón para borrar el itinerario
    if (tableType === 'gsi') {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn', 'btn-outline-success', 'btn-sm', 'm-1');
        deleteButton.textContent = 'Descartar';
        deleteButton.addEventListener('click', borrarItinerario);
        const tdButton = document.createElement('td');
        tdButton.appendChild(deleteButton);
        trHead.appendChild(tdButton);
    }

    if (tableType === 'report') {
        const tdExtra = document.createElement('td');
        tdExtra.textContent = '';
        trHead.appendChild(tdExtra);
    }

    for (const columna of columnas) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = columna;
        th.style.textAlign = 'right';
        trHead.appendChild(th);
    }
    thead.appendChild(trHead);

    // Se crean las filas de la tabla
    const lineas = []
    if (tableType === 'gsi') {
        lineas.push(...itinerario.lineas_gsi);
    } else if (tableType === 'report' || tableType === 'report-inexistentes' || tableType === 'csv') {
        lineas.push(...itinerario.lineas_reporte);
    }

    for (const linea of lineas) {
        const trBody = document.createElement('tr');
        trBody.classList.add('table-secondary', 'text-nowrap');

        // Crear botón para borrar la fila
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn', 'btn-outline-success', 'btn-sm', 'm-1');
        deleteButton.textContent = 'Descartar';
        if (tableType === 'report') {
            deleteButton.addEventListener('click', function (event) {
                trBody.remove();
                itinerarioReturned.lineas_reporte = itinerario.lineas_reporte.filter(linea_reporte => linea_reporte.nom_sensor !== linea.nom_sensor);
                if (itinerarioReturned.lineas_reporte.length === 0) {
                    document.location.reload();
                }
            });
            const tdButton = document.createElement('td');
            tdButton.appendChild(deleteButton);
            trBody.appendChild(tdButton);
        }

        if (tableType === 'gsi') {
            const tdExtra = document.createElement('td');
            tdExtra.textContent = '';
            trBody.appendChild(tdExtra);
        }

        for (const columna of columnas) {
            const td = document.createElement('td');
            let cellContent = linea[columna.toLowerCase()];
            if (typeof cellContent === 'number' && cellContent % 1 !== 0) {
                cellContent = cellContent.toFixed(5);
                if (columna === 'DIF_ULT_MED' && Math.abs(cellContent) >= 0.7) {
                    trBody.classList.add('table-warning')
                    if (Math.abs(cellContent) >= 1) {
                        trBody.classList.remove('table-warning')
                        trBody.classList.add('table-danger')
                    }
                }
            }
            td.textContent = cellContent;
            td.style.textAlign = 'right';
            trBody.appendChild(td);
        }

        

        tbody.appendChild(trBody);
    }
    function borrarItinerario(event) {
        itinerarioContainerDiv.remove();
        itinerarioReturned = null;
        itinerarios.splice(itinerarios.findIndex(itinerario => itinerario.itinerario === parseInt(numItinerario)), 1);
        if (itinerarios.length === 0) {
            document.location.reload();
        }
    }
    return itinerarioReturned;
}


function createCard(parentDiv, headerText, data, styles) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add(...styles);
    cardDiv.style.maxWidth = '20rem';

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    cardHeader.innerText = headerText;

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title');

    const cardText = document.createElement('p');
    cardText.classList.add('card-text');
    cardText.innerText = data;

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    cardDiv.appendChild(cardHeader);
    cardDiv.appendChild(cardBody);
    parentDiv.appendChild(cardDiv);
}


function mostrarProgressBar() {
    if (!resultGsiDiv.classList.contains('d-none')) {
        resultGsiDiv.classList.add('d-none');
    }
    if (!resultReportDiv.classList.contains('d-none')) {
        resultReportDiv.classList.add('d-none');
    }
    if (!resultCsvDiv.classList.contains('d-none')) {
        resultCsvDiv.classList.add('d-none');
    }
    progressBarDiv.classList.remove('d-none');
}


function mostrarReporte() {
    if (!resultGsiDiv.classList.contains('d-none')) {
        resultGsiDiv.classList.add('d-none');
    }
    if (!resultCsvDiv.classList.contains('d-none')) {
        resultCsvDiv.classList.add('d-none');
    }
    progressBarDiv.classList.add('d-none');
    resultReportDiv.classList.remove('d-none');
}


function getMedida(lectura, lecturaRef, medidaRef) {
    return (lectura - lecturaRef) * 1000 + medidaRef;
}


function mostrarCsv() {
    if (!resultGsiDiv.classList.contains('d-none')) {
        resultGsiDiv.classList.add('d-none');
    }
    if (!resultReportDiv.classList.contains('d-none')) {
        resultReportDiv.classList.add('d-none');
    }
    if (!progressBarDiv.classList.contains('d-none')) {
        progressBarDiv.classList.add('d-none');
    }
    resultCsvDiv.classList.remove('d-none');
}


function buildCsv(data) {
    const csvRows = [];
    for (let i = 0; i < data.lineas_reporte.length; i++) {
        const linea = data.lineas_reporte[i];
        csvRows.push([
            linea.fecha,
            linea.nom_sensor || linea.nom_campo,
            linea.cota_comp,
        ].join(';'));
    }
    return csvRows.join('\n');
}


function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
}
