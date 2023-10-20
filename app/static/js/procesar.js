
document.addEventListener('DOMContentLoaded', () => {
    const reporteDiv = document.getElementById('reporte');

    data.forEach((element) => {
        const itinerario = element['itinerario'];
        const existentes = JSON.parse(element['existentes']);
        const inexistentes = JSON.parse(element['inexistentes']);

        const title = document.createElement('h3');
        title.id = `title-${itinerario}`;
        title.classList.add('container', 'mt-5');
        title.innerText = `Itinerario ${itinerario}`;
        reporteDiv.appendChild(title);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.id = `buttons-${itinerario}`;
        buttonsDiv.classList.add('btn-group', 'd-flex', 'justify-content-end');
        reporteDiv.appendChild(buttonsDiv);

        if (existentes != null && existentes != undefined && Object.keys(existentes).length > 0) {
            // Crear tabla de existentes
            const existentesDiv = document.createElement('div');
            existentesDiv.id = `existentes-${itinerario}`;
            existentesDiv.classList.add('table-responsive', 'table', 'table-hover', 'mt-3');
            const subtitle = document.createElement('h4');
            subtitle.innerText = 'Reporte de resultados';
            existentesDiv.appendChild(subtitle);
            createTable(existentesDiv, existentes);
            reporteDiv.appendChild(existentesDiv);
        }

        if (inexistentes != null && inexistentes != undefined && Object.keys(inexistentes).length > 0) {
            // Crear tabla de inexistentes
            const inexistentesDiv = document.createElement('div');
            inexistentesDiv.id = `inexistentes-${itinerario}`;
            inexistentesDiv.classList.add('table-responsive', 'table', 'table-hover', 'mt-3');
            const subtitle = document.createElement('h4');
            subtitle.innerText = 'Los siguientes puntos no se han encontrado en la base de datos';
            inexistentesDiv.appendChild(subtitle);
            createTable(inexistentesDiv, inexistentes);
            reporteDiv.appendChild(inexistentesDiv);
        }

        createButtons(buttonsDiv, 'Aceptar', 'Rechazar', `accept-button-${itinerario}`, `reject-button-${itinerario}`);
        const hiddenForm = document.getElementById('hidden-form-procesar');
        const hiddenInput = document.getElementById('hidden-input-procesar');
        addEventButtonAccept(`accept-button-${itinerario}`, hiddenForm, 'click', hiddenInput, 'accept', itinerario, existentes);
        addEventButtonReject(`reject-button-${itinerario}`, 'click', itinerario);
    });

    if (data.length > 1) {
        // Crear botones para aceptar o rechazar todas las tablas
        const buttonsDiv = document.getElementById('accept-reject-all-procesar');
        buttonsDiv.classList.add('btn-group', 'd-flex', 'justify-content-end');
        createButtons(buttonsDiv, 'Aceptar todos', 'Rechazar todos', 'accept-all-button', 'reject-all-button');
        const hiddenForm = document.getElementById('hidden-form-procesar');
        const hiddenInput = document.getElementById('hidden-input-procesar');
        addEventButtonAccept('accept-all-button', hiddenForm, 'click', hiddenInput, 'accept-all', 0, data);
        addEventButtonReject('reject-all-button', 'click', 0);
    }
});

// Función para crear los botones
function createButtons(parentDiv, acceptText, rejectText, acceptId, rejectId) {
    const acceptButton = document.createElement('button');
    acceptButton.classList.add('btn', 'btn-success', 'm-2');
    acceptButton.id = acceptId;
    acceptButton.innerText = acceptText;
    const rejectButton = document.createElement('button');
    rejectButton.classList.add('btn', 'btn-danger', 'm-2');
    rejectButton.id = rejectId;
    rejectButton.innerText = rejectText;

    parentDiv.appendChild(acceptButton);
    parentDiv.appendChild(rejectButton);
}

// Función para crear tablas
function createTable(parentDiv, data) {

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const cols = Object.keys(data);
    const trHead = document.createElement('tr');
    trHead.classList.add('table-primary');
    cols.forEach((col) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.innerText = col;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    parentDiv.appendChild(thead);

    const rows = Object.keys(data[cols[0]]);
    rows.forEach((row) => {
        const trBody = document.createElement('tr');
        trBody.classList.add('table-secondary');
        cols.forEach((col) => {
            const td = document.createElement('td');
            td.innerText = data[col][row];
            trBody.appendChild(td);
        });
        tbody.appendChild(trBody);
    });
    parentDiv.appendChild(tbody);
}

// Función para añadir el evento de aceptar
function addEventButtonAccept(idButton, formElement, event, inputElement, nameElement, idTable, dataTable) {
    const button = document.getElementById(idButton);
    button.addEventListener(event, () => {
        inputElement.name = nameElement;
        const dataToSend = {
            'itinerario': idTable,
            'data': dataTable
        };
        inputElement.value = JSON.stringify(dataToSend);
        const reporteDiv = document.getElementById('reporte');
        reporteDiv.style.display = 'none';
        const acceptRejectAllDiv = document.getElementById('accept-reject-all-procesar');
        acceptRejectAllDiv.remove();
        const progressBarDiv = document.getElementById('progress-bar-procesar');
        progressBarDiv.classList.remove('d-none');
        formElement.submit();
    });
}

// Función para añadir el evento de rechazar
function addEventButtonReject(idButton, event, idTable) {
    const button = document.getElementById(idButton);
    button.addEventListener(event, () => {
        console.log(data);
        data.forEach((element) => {
            console.log(element);
            console.log(element['itinerario']);
        });
        if (idTable !== 0) {
            const findIndex = data.findIndex((element) => element['itinerario'] === idTable);
            if (findIndex !== -1) {
                data.splice(findIndex, 1);
                const existentesDiv = document.getElementById(`existentes-${idTable}`);
                const inexistentesDiv = document.getElementById(`inexistentes-${idTable}`);
                existentesDiv.remove();
                inexistentesDiv.remove();
                const buttonsDiv = document.getElementById(`buttons-${idTable}`);
                buttonsDiv.remove();
                const title = document.getElementById(`title-${idTable}`);
                title.remove();
                if (data.length === 1) {
                    const buttonsAllDiv = document.getElementById('accept-reject-all');
                    buttonsAllDiv.remove();
                }
                if (data.length === 0) {
                    location.href = '/';
                }
            }
        } else {
            location.href = '/';
        }
    });
}