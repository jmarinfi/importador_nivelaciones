
// Componentes principales
const estadilloDiv = document.getElementById('estadillo-div');
const formGsiDiv = document.getElementById('form-gsi-div');
const resultGsiDiv = document.getElementById('result-gsi');
const resultGsiTablesDiv = document.getElementById('tables-gsi');
const buttonsGsiDiv = document.getElementById('accept-reject-all-gsi');
const resultReportDiv = document.getElementById('result-report');
const resultReportTablesDiv = document.getElementById('tables-report');
const buttonsReportDiv = document.getElementById('accept-reject-all-report');
const resultCsvDiv = document.getElementById('result-csv');
const resultCsvTablesDiv = document.getElementById('tables-csv');
const progressBarDiv = document.getElementById('progress-bar');

// Elementos accionables
const submitGsiButton = document.getElementById('submit-gsi');

// Elementos de formulario
const formGsi = document.getElementById('form-gsi');

// Urls de los endpoints
urlHome;

// Función para enviar el archivo GSI al servidor y recibir el objeto Gsi
submitGsiButton.addEventListener('click', async (event) => {
    event.preventDefault();
    const formData = new FormData(formGsi);
    const file = formData.get('formFile');

    if (file.size === 0) {
        console.log('No se ha seleccionado ningún archivo');
        return;
    }

    const date = formData.get('dateInput');
    const time = formData.get('timeInput');

    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = async (evt) => {
        const rawContent = evt.target.result;
        const regexWord = /([0-9]{2}[0-9.])([0-9.]{3})([+\-])([^\s]{8,16})\s/g;
        const matches = rawContent.matchAll(regexWord);

        let itinerario = 0;
        let metodo = null;
        let distAcum = 0.0;
        let lineaActual = null;
        let itinerarioActual = null;
        const itinerariosGsi = [];

        for (const match of matches) {
            let [_, wordIndex, infCompl, sign, data] = match;
            wordIndex = wordIndex.replace(/\./g, '');
            infCompl = infCompl.replace(/\./g, '');
            data = data.replace(/\?|\./g, '');

            if (wordIndex === '410') {
                itinerario += 1;
                distAcum = 0.0;
                metodo = data === '1' ? 'EF' : data === '2' ? 'EFFE' : data === '3' ? 'aEF' : data === '4' ? 'aEFFE' : data === '10' ? 'Comprob_y_ajuste' : NaN;
                itinerarioActual = {
                    'itinerario': itinerario,
                    'fecha': `${date} ${time}`,
                    'error_de_cierre': 0.0,
                    'tolerancia': 0.0,
                    'error_km': 0.0,
                    'distancia_total': 0.0,
                    'lineas_gsi': [],
                }
                itinerariosGsi.push(itinerarioActual);
                continue;
            }

            if (wordIndex === '110') {
                if (lineaActual && !lineaActual.radiado && lineaActual.dist_mira) {
                    distAcum += lineaActual.dist_mira;
                    lineaActual.dist_acum = distAcum;
                }
                
                lineaActual = {
                    'num_linea': parseInt(infCompl),
                    'metodo': metodo,
                    'itinerario': itinerario,
                    'nom_campo': data.replace(/^0+/, '') || '0',
                    'dist_acum': parseFloat(distAcum),
                };
                itinerarioActual.lineas_gsi.push(lineaActual);
                continue;
            }

            if (wordIndex === '32') {
                lineaActual['dist_mira'] = (parseFloat(data) / 100000) * parseInt(sign + '1');
                continue;
            }

            if (wordIndex === '83') {
                lineaActual['cota'] = (parseFloat(data) / 100000) * parseInt(sign + '1');
                continue;
            }

            if (wordIndex === '331') {
                lineaActual['espalda'] = (parseFloat(data) / 100000) * parseInt(sign + '1');
                continue;
            }

            if (wordIndex === '332') {
                lineaActual['frente'] = (parseFloat(data) / 100000) * parseInt(sign + '1');
            }

            if (wordIndex === '333') {
                lineaActual['radiado'] = (parseFloat(data) / 100000) * parseInt(sign + '1');
                continue;
            }

            if (wordIndex === '390') {
                lineaActual['med_rep'] = parseInt(data) * parseInt(sign + '1');
                continue;
            }

            if (wordIndex === '391') {
                lineaActual['desv_est'] = parseInt(data) * parseInt(sign + '1');
                continue;
            }

            if (wordIndex === '392') {
                lineaActual['mediana'] = parseInt(data) * parseInt(sign + '1');
                continue;
            }

            if (wordIndex === '573') {
                lineaActual['balance'] = (parseFloat(data) / 100000) * parseInt(sign + '1');
                continue;
            }

            if (wordIndex === '574') {
                lineaActual['dist_total'] = (parseFloat(data) / 100000) * parseInt(sign + '1');
                continue;
            }
        }

        for (const itinerario of itinerariosGsi) {
            const cotaInicial = itinerario.lineas_gsi[0].cota;
            const cotaFinal = itinerario.lineas_gsi[itinerario.lineas_gsi.length - 1].cota;
            itinerario.error_de_cierre = (cotaFinal - cotaInicial) * 1000;
            itinerario.distancia_total = itinerario.lineas_gsi[itinerario.lineas_gsi.length - 1].dist_acum;
            itinerario.error_km = Math.abs(itinerario.error_de_cierre / (Math.sqrt(itinerario.distancia_total / 1000)));
            itinerario.tolerancia = 0.3 * Math.sqrt(itinerario.distancia_total / 1000);
            for (const linea of itinerario.lineas_gsi) {
                if (linea.cota) {
                    linea['cota_comp'] = linea.cota - (linea.dist_acum * (itinerario.error_de_cierre / 1000) / itinerario.distancia_total);
                }
            }
        }

        console.log(itinerariosGsi);

        estadilloDiv.classList.add('d-none');
        formGsiDiv.classList.add('d-none');
        resultGsiDiv.classList.remove('d-none');
        
        for (const itinerario of itinerariosGsi) {
            crearTablaGsi(itinerario, resultGsiTablesDiv, 'gsi');
        }

        // Añadir eventos a los botones de aceptar y rechazar
        resultGsiTablesDiv.addEventListener('click', async (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.id.includes('btn-success')) {
                const itinerario = event.target.getAttribute('itinerario');
                const itinerarioGsi = itinerariosGsi.find(itinerarioGsi => itinerarioGsi.itinerario === parseInt(itinerario));
                const nomsCampoUnicos = [...new Set(itinerarioGsi.lineas_gsi.map(linea => linea.nom_campo))];
                console.log(nomsCampoUnicos);

                resultGsiDiv.classList.add('d-none');
                progressBarDiv.classList.remove('d-none');

                const response = await fetch(urlHome, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nomsCampoUnicos),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(data);

                    const camposUnicosResponse = [...new Set(data.lineas_reporte.map(linea => linea.nom_campo))];
                    let idsInexistentes = nomsCampoUnicos.filter(nomCampo => !camposUnicosResponse.includes(nomCampo));
                    console.log(camposUnicosResponse);
                    console.log(idsInexistentes);

                    progressBarDiv.classList.add('d-none');
                    resultReportDiv.classList.remove('d-none');
                    const resultReportExistentesDiv = document.createElement('div');
                    resultReportExistentesDiv.classList.add('container')
                    resultReportTablesDiv.appendChild(resultReportExistentesDiv);

                    if (data.lineas_reporte.length > 0) {
                        // Ampliar data.lineas_reporte con los campos de itinerarioGsi.lineas_gsi
                        for (const linea of data.lineas_reporte) {
                            const lineaGsi = itinerarioGsi.lineas_gsi.find(lineaGsi => lineaGsi.nom_campo === linea.nom_campo && lineaGsi.cota_comp);
                            let fecha = new Date(itinerarioGsi.fecha).toISOString();
                            linea.fecha = `${fecha.slice(8, 10)}-${fecha.slice(5, 7)}-${fecha.slice(0, 4)} ${fecha.slice(11, 19)}`;
                            linea.cota_comp = lineaGsi.cota_comp;
                            linea.medida = getMedida(linea.cota_comp, linea.lect_ref, linea.medida_ref);
                            linea.dif_ult_med = linea.medida - getMedida(linea.ult_lect, linea.lect_ref, linea.medida_ref);
                            linea.dif_penult_med = linea.medida - getMedida(linea.penult_lect, linea.lect_ref, linea.medida_ref);
                            linea.dif_antepenult_med = linea.medida - getMedida(linea.antepenult_lect, linea.lect_ref, linea.medida_ref);
                            linea['linea_gsi'] = lineaGsi;
                            fecha = new Date(linea.fecha_ref).toISOString();
                            linea.fecha_ref = `${fecha.slice(8, 10)}-${fecha.slice(5, 7)}-${fecha.slice(0, 4)} ${fecha.slice(11, 19)}`;

                        }

                        crearTablaGsi(data, resultReportExistentesDiv, 'report');
                        
                    } else {
                        idsInexistentes = nomsCampoUnicos;
                    }
                    
                    if (idsInexistentes.length > 0) {
                        itinerarioGsi.lineas_gsi = itinerarioGsi.lineas_gsi.filter(linea =>  idsInexistentes.includes(linea.nom_campo) && linea.cota_comp);
                        const fecha = new Date(itinerarioGsi.fecha).toISOString();
                        itinerarioGsi.lineas_gsi.forEach(linea => linea.fecha = `${fecha.slice(8, 10)}-${fecha.slice(5, 7)}-${fecha.slice(0, 4)} ${fecha.slice(11, 19)}`);

                        const resultReportInexistentesDiv = document.createElement('div');
                        resultReportInexistentesDiv.classList.add('container')
                        resultReportTablesDiv.appendChild(resultReportInexistentesDiv);
                        crearTablaGsi(itinerarioGsi, resultReportInexistentesDiv, 'report-inexistentes');
                    }

                    resultReportTablesDiv.addEventListener('click', async (event) => {
                        if (event.target.tagName === 'BUTTON' && event.target.id.includes('btn-success')) {
                            resultReportDiv.classList.add('d-none');
                            resultCsvDiv.classList.remove('d-none');

                            const resultCsvTableDiv = document.createElement('div');
                            resultCsvTableDiv.classList.add('container')
                            resultCsvTablesDiv.appendChild(resultCsvTableDiv);

                            crearTablaGsi(data, resultCsvTableDiv, 'csv');

                            const csvText = buildCsv(data);

                            resultCsvTablesDiv.addEventListener('click', async (event) => {
                                if (event.target.tagName === 'BUTTON' && event.target.id.includes('btn-descargar-csv')) {
                                    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement('a');
                                    const url = URL.createObjectURL(blob);
                                    link.setAttribute('href', url);
                                    link.setAttribute('download', `itinerario-${data.lineas_reporte[0].linea_gsi.itinerario}.csv`);
                                    link.style.visibility = 'hidden';
                                    link.click();
                                }
                                if (event.target.tagName === 'BUTTON' && event.target.id.includes('btn-enviar-csv')) {
                                    const response = await fetch(urlEnviarCsv, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'text/csv;charset=utf-8;'
                                        },
                                        body: csvText,
                                    });

                                    if (response.ok) {
                                        const data = await response.text();
                                        if (data === 'OK') {
                                            alert('CSV enviado correctamente');
                                            document.location.reload();
                                        } else {
                                            alert('No se ha podido enviar el CSV al servidor. Vuelve a intentarlo o descárgalo e impórtalo manualmente.\n' + data);
                                        }
                                    } else {
                                        alert(`Error: ${response.statusText}`);
                                        document.location.reload();
                                    }
                                }
                            });
                        }
                    });

                } else {
                    alert(`Error: ${response.statusText}`);
                    document.location.reload();
                }
            }
        });

        if (itinerariosGsi.length > 1) {
            buttonsGsiDiv.classList.remove('d-none');

            // Añadir eventos a los botones de aceptar y rechazar todos
            buttonsGsiDiv.addEventListener('click', async (event) => {
                if (event.target.tagName === 'BUTTON' && event.target.id === 'accept-all-gsi') {
                    console.log('Aceptar todos');
                    const nomsCampoUnicos = [...new Set(itinerariosGsi.map(itinerario => itinerario.lineas_gsi.map(linea => linea.nom_campo)).flat())];
                    console.log(nomsCampoUnicos);

                    resultGsiDiv.classList.add('d-none');
                    progressBarDiv.classList.remove('d-none');

                    const response = await fetch(urlHome, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(nomsCampoUnicos),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log(data);

                        const camposUnicosResponse = [...new Set(data.lineas_reporte.map(linea => linea.nom_campo))];
                        let idsInexistentes = nomsCampoUnicos.filter(nomCampo => !camposUnicosResponse.includes(nomCampo));
                        console.log(camposUnicosResponse);
                        console.log(idsInexistentes);

                        progressBarDiv.classList.add('d-none');
                        resultReportDiv.classList.remove('d-none');
                        const resultReportExistentesDiv = document.createElement('div');
                        resultReportExistentesDiv.classList.add('container')
                        resultReportTablesDiv.appendChild(resultReportExistentesDiv);

                        if (data.lineas_reporte.length > 0) {
                            for (const linea of data.lineas_reporte) {
                                const lineaGsi = itinerariosGsi.find(itinerario =>
                                    itinerario.lineas_gsi.some(lineaGsi =>
                                        lineaGsi.nom_campo === linea.nom_campo && lineaGsi.cota_comp)
                                )?.lineas_gsi.find(lineaGsi =>
                                    lineaGsi.nom_campo === linea.nom_campo && lineaGsi.cota_comp
                                );
                                let fecha = new Date(itinerariosGsi[0].fecha).toISOString();
                                linea.fecha = `${fecha.slice(8, 10)}-${fecha.slice(5, 7)}-${fecha.slice(0, 4)} ${fecha.slice(11, 19)}`;
                                linea.cota_comp = lineaGsi.cota_comp;
                                linea.medida = getMedida(linea.cota_comp, linea.lect_ref, linea.medida_ref);
                                linea.dif_ult_med = linea.medida - getMedida(linea.ult_lect, linea.lect_ref, linea.medida_ref);
                                linea.dif_penult_med = linea.medida - getMedida(linea.penult_lect, linea.lect_ref, linea.medida_ref);
                                linea.dif_antepenult_med = linea.medida - getMedida(linea.antepenult_lect, linea.lect_ref, linea.medida_ref);
                                linea['linea_gsi'] = lineaGsi;
                                fecha = new Date(linea.fecha_ref).toISOString();
                                linea.fecha_ref = `${fecha.slice(8, 10)}-${fecha.slice(5, 7)}-${fecha.slice(0, 4)} ${fecha.slice(11, 19)}`;
                            }

                            crearTablaGsi(data, resultReportExistentesDiv, 'report');
                        } else {
                            idsInexistentes = nomsCampoUnicos;
                        }

                        if (idsInexistentes.length > 0) {
                            const dataInexistentes = [];
                            for (const itinerario of itinerariosGsi) {
                                for (const linea of itinerario.lineas_gsi) {
                                    if (idsInexistentes.includes(linea.nom_campo) && linea.cota_comp) {
                                        dataInexistentes.push(linea);
                                    }
                                }
                            }
                            console.log(dataInexistentes);
                            const resultReportInexistentesDiv = document.createElement('div');
                            resultReportInexistentesDiv.classList.add('container')
                            resultReportTablesDiv.appendChild(resultReportInexistentesDiv);
                            crearTablaGsi(dataInexistentes, resultReportInexistentesDiv, 'report-inexistentes');
                        }

                    } else {
                        alert(`Error: ${response.statusText}`);
                        document.location.reload();
                    }
                }
            });
        }
    };
});

// Función para crear las tablas de los datos GSI
function crearTablaGsi(itinerario, parentDiv, tableType) {
    const title = document.createElement('h3');
    title.classList.add('mt-3');
    let titleText = '';
    let numItinerario = 0;
    if (tableType === 'gsi') {
        numItinerario = itinerario.itinerario;
        titleText = `Itinerario ${numItinerario}`;
    } else if (tableType === 'report') {
        numItinerario = itinerario.lineas_reporte[0].linea_gsi.itinerario;
        titleText = `Reporte itinerario ${numItinerario}`;
    } else if (tableType === 'report-inexistentes') {
        numItinerario = itinerario.itinerario;
        titleText = `Reporte itinerario ${numItinerario} - Nombres de campo no encontrados`;
    } else if (tableType === 'csv') {
        numItinerario = itinerario.lineas_reporte[0].linea_gsi.itinerario;
        titleText = `CSV itinerario ${numItinerario}`;
    }
    title.textContent = titleText;
    parentDiv.appendChild(title);

    if (tableType === 'gsi') {
        // Se crean los elementos de las tarjetas
        const cardsDiv = document.createElement('div');
        cardsDiv.classList.add('card-group', 'mt-3');
        createCard(cardsDiv, 'Error de Cierre', itinerario.error_de_cierre.toFixed(5));
        createCard(cardsDiv, 'Tolerancia', itinerario.tolerancia.toFixed(5));
        createCard(cardsDiv, 'Error Km a Posteriori', itinerario.error_km.toFixed(5));
        createCard(cardsDiv, 'Distancia Total', itinerario.distancia_total.toFixed(5));
        parentDiv.appendChild(cardsDiv);
    }

    if (tableType === 'gsi' || tableType === 'report') {
        // Se crean los botones de aceptar y rechazar
        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('btn-group', 'd-flex');
        createButtons(buttonsDiv, 'Aceptar', 'Rechazar', `btn-success${numItinerario}`, `btn-danger${numItinerario}`, { 'itinerario': numItinerario });
        parentDiv.appendChild(buttonsDiv);
    } else if (tableType === 'report-inexistentes') {
        const buttonDescargarInexistentes = document.createElement('button');
        buttonDescargarInexistentes.classList.add('btn', 'btn-lg', 'btn-primary', 'm-2');
        buttonDescargarInexistentes.innerText = 'Descargar cotas de nombres de campo no encontrados';
        buttonDescargarInexistentes.id = `btn-descargar-inexistentes${numItinerario}`;
        buttonDescargarInexistentes.setAttribute('type', 'button');
        parentDiv.appendChild(buttonDescargarInexistentes);
    } else if (tableType === 'csv') {
        const buttonDescargarCsv = document.createElement('button');
        buttonDescargarCsv.classList.add('btn', 'btn-lg', 'btn-primary', 'm-2');
        buttonDescargarCsv.innerText = 'Descargar CSV';
        buttonDescargarCsv.id = `btn-descargar-csv${numItinerario}`;
        buttonDescargarCsv.setAttribute('type', 'button');
        parentDiv.appendChild(buttonDescargarCsv);

        const buttonEnviarCsv = document.createElement('button');
        buttonEnviarCsv.classList.add('btn', 'btn-lg', 'btn-primary', 'm-2');
        buttonEnviarCsv.innerText = 'Enviar CSV';
        buttonEnviarCsv.id = `btn-enviar-csv${numItinerario}`;
        buttonEnviarCsv.setAttribute('type', 'button');
        parentDiv.appendChild(buttonEnviarCsv);
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
    parentDiv.appendChild(tablaDiv);

    // Se crea el encabezado de la tabla
    const columnas = [];
    if (tableType === 'gsi') {
        columnas.push('METODO', 'ITINERARIO', 'NOM_CAMPO', 'DIST_MIRA', 'COTA', 'ESPALDA', 'FRENTE', 'RADIADO', 'MED_REP', 'DESV_EST', 'MEDIANA', 'BALANCE', 'DIST_TOTAL', 'DIST_ACUM', 'COTA_COMP');
    } else if (tableType === 'report') {
        columnas.push('FECHA', 'NOM_CAMPO', 'NOM_SENSOR', 'COTA_COMP', 'ULT_LECT', 'PENULT_LECT', 'ANTEPENULT_LECT', 'FECHA_REF', 'LECT_REF', 'MEDIDA_REF', 'MEDIDA', 'DIF_ULT_MED', 'DIF_PENULT_MED', 'DIF_ANTEPENULT_MED');
    } else if (tableType === 'report-inexistentes') {
        columnas.push('FECHA', 'NOM_CAMPO', 'COTA_COMP');
    } else if (tableType === 'csv') {
        columnas.push('FECHA', 'NOM_SENSOR', 'COTA_COMP')
    }
    const trHead = document.createElement('tr');
    trHead.classList.add('table-primary');
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
    } else if (tableType === 'report' || tableType === 'csv') {
        lineas.push(...itinerario.lineas_reporte);
    } else if (tableType === 'report-inexistentes') {
        lineas.push(...itinerario.lineas_gsi);
    }
    for (const linea of lineas) {
        const trBody = document.createElement('tr');
        trBody.classList.add('table-secondary', 'text-nowrap');
        for (const columna of columnas) {
            const td = document.createElement('td');
            let cellContent =  linea[columna.toLowerCase()];
            // Si el valor de la celda es un float, se formatea con 5 decimales
            if (typeof cellContent === 'number' && cellContent % 1 !== 0) {
                cellContent = cellContent.toFixed(5);
                if (columna === 'DIF_ULT_MED' && Math.abs(cellContent) > 0.5) {
                    trBody.classList.add('table-warning')
                    if (Math.abs(cellContent) > 1) {
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
}

// Función para crear botones
function createButtons(parentDiv, acceptText, rejectText, idAceptar, idRechazar, attrs) {
    // Crear botón de aceptar
    const buttonAccept = document.createElement('button');
    buttonAccept.classList.add('btn', 'btn-success', 'm-2');
    buttonAccept.innerText = acceptText;
    buttonAccept.id = idAceptar;
    for (const [key, value] of Object.entries(attrs)) {
        buttonAccept.setAttribute(key, value);
    }

    // Crear botón de rechazar
    const buttonReject = document.createElement('button');
    buttonReject.classList.add('btn', 'btn-danger', 'm-2');
    buttonReject.innerText = rejectText;
    buttonReject.id = idRechazar;
    for (const [key, value] of Object.entries(attrs)) {
        buttonReject.setAttribute(key, value);
    }

    // Añadir los botones al div padre
    parentDiv.appendChild(buttonAccept);
    parentDiv.appendChild(buttonReject);
}

// Función para crear las cards
function createCard(parentDiv, headerText, data) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'text-white', 'bg-primary', 'm-3');
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

// Función para obtener la medida
function getMedida(cota, lectura_referencia, medida_referencia) {
    return (cota - lectura_referencia) * 1000 + medida_referencia;
}

// Función para construir el CSV
function buildCsv(data) {
    const csvRows = [];
    for (let i = 0; i < data.lineas_reporte.length; i++) {
        const linea = data.lineas_reporte[i];
        csvRows.push([
            linea.fecha,
            linea.nom_sensor,
            linea.cota_comp,
        ].join(';'));
    }
    return csvRows.join('\n');
}