console.log(data);

data.forEach(entry => {
    const itinerario = entry['itinerario'];
    const csv = entry['csv'];

    const csvDiv = document.getElementById('csv');

    const title = document.createElement('h3');
    title.id = `title-${itinerario}`;
    title.innerText = `Se ha exportado el siguiente CSV del itinerario ${itinerario}:`;
    csvDiv.appendChild(title);

    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('btn', 'btn-primary', 'btn-lg', 'm-2');
    button.innerText = 'Descargar CSV';
    csvDiv.appendChild(button);

    const table = document.createElement('table');
    table.id = `table-${itinerario}`;
    table.classList.add('table-responsive', 'table', 'table-hover', 'mt-3');
    csvDiv.appendChild(table);

    createTable(table, csv);
    addEventButtonDownload(button, csv);

});

// Función para añadir el evento de descargar
function addEventButtonDownload(button, data) {
    button.addEventListener('click', () => {
        const csv = data;
        const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const csvURL = window.URL.createObjectURL(csvData);
        const tempLink = document.createElement('a');
        tempLink.href = csvURL;
        tempLink.setAttribute('download', 'data.csv');
        tempLink.click();
    });
}

// Función para crear las tablas
function createTable(parentDiv, data) {
    console.log(data);
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const cols = ['FECHA', 'NOM_SENSOR', 'LECTURA'];
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

    const rows = data.split('\n');
    rows.forEach((row) => {
        if (row !== '') {
            const trBody = document.createElement('tr');
            trBody.classList.add('table-secondary');
            const cells = row.split(';');
            cells.forEach((cell) => {
                const td = document.createElement('td');
                td.innerText = cell;
                trBody.appendChild(td);
            });
            tbody.appendChild(trBody);
        }
    });
    parentDiv.appendChild(tbody);
}