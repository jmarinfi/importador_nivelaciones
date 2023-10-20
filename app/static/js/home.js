// Evento que se ejecuta cuando el documento HTML está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    buildTables(tables);
});

// Función para construir tablas y tarjetas (cards)
function buildTables(tables) {
    // Obtener el div donde se mostrarán los resultados
    const resultDiv = document.getElementById('result');
    
    // Iterar sobre cada entrada de las tablas
    tables.forEach(entry => {
        // Crear y añadir título del itinerario
        const title = document.createElement('h3');
        title.classList.add('container', 'mt-5');
        title.innerText = `Itinerario ${entry[0]}`;
        resultDiv.appendChild(title);

        const itinerario = entry[0];
        const tableData = JSON.parse(entry[1]);

        // Contenedor para las tarjetas
        const cardsDiv = document.createElement('div');
        cardsDiv.classList.add('card-group');

        // Crear tarjetas para cada parámetro
        createCard(cardsDiv, 'Error de Cierre', errorDeCierre[itinerario]);
        createCard(cardsDiv, 'Tolerancia', tolerancia[itinerario]);
        createCard(cardsDiv, 'Error Km a Posteriori', errorKmPosteriori[itinerario]);
        createCard(cardsDiv, 'Distancia Total', distanciaTotal[itinerario]);

        // Añadir las tarjetas al div de resultados
        resultDiv.appendChild(cardsDiv);

        // Crear botones para aceptar o rechazar la tabla
        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('btn-group', 'd-flex', 'justify-content-end');
        createButtons(buttonsDiv, 'Aceptar', 'Rechazar', `accept-button-${itinerario}`, `reject-button-${itinerario}`);

        // Añadir los botones al div de resultados
        resultDiv.appendChild(buttonsDiv);

        // Crear la tabla de datos
        const tableDiv = document.createElement('div');
        tableDiv.classList.add('table-responsive', 'table', 'table-hover', 'mt-3');
        createTable(tableDiv, tableData);

        // Añadir la tabla al div de resultados
        resultDiv.appendChild(tableDiv);

        // Añadir eventos a los botones y enviar datos por formulario oculto
        const form = document.getElementById('hidden-form');
        const input = document.getElementById('hidden-input');
        addEventButtonAccept(`accept-button-${itinerario}`, form, 'click', input, 'accept', itinerario, tableData);
        addEventButtonReject(`reject-button-${itinerario}`, 'click', itinerario);
    });

    if (tables.length > 1) {
        // Crear botones para aceptar o rechazar todas las tablas
        const buttonsDiv = document.getElementById('accept-reject-all');
        buttonsDiv.classList.add('btn-group', 'd-flex', 'justify-content-end');
        createButtons(buttonsDiv, 'Aceptar todos', 'Rechazar todos', 'accept-all-button', 'reject-all-button');
        const form = document.getElementById('hidden-form');
        const input = document.getElementById('hidden-input');
        addEventButtonAccept('accept-all-button', form, 'click', input, 'accept-all', 0, tables);
        addEventButtonReject('reject-all-button', 'click', 0);
    }
}

// Función para crear una tarjeta
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
    cardText.innerText = Number(data).toFixed(4);

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    cardDiv.appendChild(cardHeader);
    cardDiv.appendChild(cardBody);
    parentDiv.appendChild(cardDiv);
}

// Función para crear botones
function createButtons(parentDiv, acceptText, rejectText, idAceptar, idRechazar) {
    // Crear botón de aceptar
    const buttonAccept = document.createElement('button');
    buttonAccept.classList.add('btn', 'btn-success', 'm-2');
    buttonAccept.innerText = acceptText;
    buttonAccept.id = idAceptar;

    // Crear botón de rechazar
    const buttonReject = document.createElement('button');
    buttonReject.classList.add('btn', 'btn-danger', 'm-2');
    buttonReject.innerText = rejectText;
    buttonReject.id = idRechazar;

    // Añadir los botones al div padre
    parentDiv.appendChild(buttonAccept);
    parentDiv.appendChild(buttonReject);
}

// Función para crear una tabla
function createTable(parentDiv, data) {
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const cols = Object.keys(data);
    const trHead = document.createElement('tr');
    trHead.classList.add('table-primary');
    for (let i = 0; i < cols.length; i++) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.innerText = cols[i];
        trHead.appendChild(th);
    }
    thead.appendChild(trHead);
    parentDiv.appendChild(thead);

    const rows = Object.keys(data[cols[0]]);
    for (let i = 0; i < rows.length; i++) {
        const trBody = document.createElement('tr');
        trBody.classList.add('table-secondary');
        for (let j = 0; j < cols.length; j++) {
            const td = document.createElement('td');
            td.innerText = data[cols[j]][rows[i]];
            trBody.appendChild(td);
        }
        tbody.appendChild(trBody);
    }
    parentDiv.appendChild(tbody);
}

let isFormCreated = false;

// Función para añadir eventos a los botones de aceptar
function addEventButtonAccept(idButton, formElement, event, inputElement, nameElement, idTable, dataTable) {
    // TODO: solicitar fecha y hora
    document.getElementById(idButton).addEventListener(event, (e) => {
        // Prevenir el comportamiento por defecto
        e.preventDefault();

        // Verificar si el formulario ya ha sido creado
        if (isFormCreated) {
            return;
        }

        // Marcar que el formulario ya ha sido creado
        isFormCreated = true;

        // Crear formulario para solicitar fecha y hora
        const dateTimeForm = document.createElement('form');
        dateTimeForm.classList.add('p-4');
        dateTimeForm.id = 'date-time-form';
        dateTimeForm.innerHTML = `
            <fieldset>
            <div class="form-group">
                <label for="dateInput" class="form-label">Fecha de la lectura</label>
                <input type="date" id="dateInput" class="form-control" required>
                <label for="timeInput" class="form-label mt-3">Hora de la lectura</label>
                <input type="time" id="timeInput" class="form-control" step="1" required>
            </div>
            <button type="submit" class="btn btn-primary mt-3">Enviar</button>
            </fieldset>
        `;

        // Añadir el formulario
        const btnGroupDiv = document.getElementById(idButton).parentNode;
        btnGroupDiv.innerHTML = '';
        const dateTimeFormDiv = document.createElement('div');
        dateTimeFormDiv.classList.add('container');
        dateTimeFormDiv.appendChild(dateTimeForm);
        
        // Agregar datetimeFormDiv
        btnGroupDiv.appendChild(dateTimeFormDiv);

        // Obtener la fecha y hora actual
        const today = new Date();
        const date = today.toISOString().slice(0, 10);
        const time = today.toTimeString().slice(0, 8);

        // Rellenar los campos del formulario
        document.getElementById('dateInput').value = date;
        document.getElementById('timeInput').value = time;

        // Escuchar el evento submit del formulario
        dateTimeForm.addEventListener('submit', (e) => {
            // Prevenir el comportamiento por defecto
            e.preventDefault();

            // Obtener la fecha y hora
            const date = document.getElementById('dateInput').value;
            const time = document.getElementById('timeInput').value;

            // Crear el objeto a enviar
            const datetime = `${date} ${time}`;
            const dataToSend = {
                'itinerario': idTable,
                'tableData': dataTable,
                'datetime': datetime,
            };

            // Enviar los datos por formulario oculto
            inputElement.name = nameElement;
            inputElement.value = JSON.stringify(dataToSend);

            const acceptRejectAllDiv = document.getElementById('accept-reject-all');
            acceptRejectAllDiv.remove();
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'none';
            dateTimeForm.style.display= 'none';
            const formGsiDiv = document.getElementById('form-gsi');
            formGsiDiv.remove();
            const dEstadilloDiv = document.getElementById('d-estadillo');
            dEstadilloDiv.remove();
            const progressBarElement = document.getElementById('progress-bar');
            progressBarElement.classList.remove('d-none');

            formElement.submit();
            // Borrar el formulario
        });
    });
}

// Función para añadir eventos a los botones de rechazar
function addEventButtonReject(idButton, event, idTable) {
    document.getElementById(idButton).addEventListener(event, () => {
        if (idTable !== 0) {
            // Borrar la tabla del itinerario rechazado identificada por idTable y recarga la página
            const index = tables.findIndex(entry => entry[0] === idTable);
            if (index != -1) {
                tables.splice(index, 1);
                document.getElementById('result').innerHTML = '';
                document.getElementById('accept-reject-all').innerHTML = '';
                if (tables.length == 0) {
                    // Si no quedan tablas, recargar la página sin parámetros
                    location.href = '/';
                }
                buildTables(tables);
            }
        } else {
            // Borrar todas las tablas y recargar la página
            document.getElementById('result').innerHTML = '';
            document.getElementById('accept-reject-all').innerHTML = '';
            location.href = '/';
        }
    });
}
