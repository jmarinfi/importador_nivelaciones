// Autor: Joan Marín


// Mostrar avisos
export function showAlertDanger(alertDiv, alertP, message) {
    alertDiv.classList.remove("d-none");
    alertP.innerHTML = message;
}


export function showAlertSuccess(alertDiv, alertP, message) {
    alertDiv.classList.remove("d-none");
    alertP.innerHTML = message;
}


// Crear elemento
export function createElement(tagName, id, styles, parentElement, innerHTML = "", attributes = {}) {
    const newElement = document.createElement(tagName);
    newElement.id = id;
    newElement.classList.add(...styles);
    newElement.innerHTML = innerHTML;
    Object.entries(attributes).forEach(([key, value]) => {
        newElement.setAttribute(key, value);
    });
    parentElement.appendChild(newElement);
    return newElement;
}


// Preparar el layout de la página
export function prepareLayout(elementsToHide, elementsToShow) {
    elementsToHide.forEach(element => {
        if (!element.classList.contains("d-none")) {
            element.classList.add("d-none");
        }
    });

    elementsToShow.forEach(element => {
        if (element.classList.contains("d-none")) {
            element.classList.remove("d-none");
        }
    });
}


// Construir una tabla a partir de un itinerario
export function buildTable(tableObject, parentDiv) {
    const tableDivElement = createElement('div', tableObject.tableDivElement.id, tableObject.tableDivElement.classes, parentDiv);
    const tableElement = createElement('table', tableObject.tableElement.id, tableObject.tableElement.classes, tableDivElement);
    const theadElement = createElement('thead', tableObject.theadElement.id, tableObject.theadElement.classes, tableElement);
    const trHeadElement = createElement('tr', tableObject.trHeadElement.id, tableObject.trHeadElement.classes, theadElement, '');
    if (tableObject.linesHaveButton) {
        const thButtonElement = createElement('th', '', ['text-end'], trHeadElement);
    }
    tableObject.trHeadElement.headerLine.forEach(header => {
        const thElement = createElement('th', 'th-head-' + header, ['text-end'], trHeadElement, header);
    });
    const tbodyElement = createElement('tbody', tableObject.tbodyElement.id, tableObject.tbodyElement.classes, tableElement);
    tableObject.lines.forEach(line => {
        const trElement = createElement('tr', '', ['text-end', 'text-nowrap'], tbodyElement);
        if (tableObject.linesHaveButton) {
            const tdButtonElement = createElement('td', '', ['text-end'], trElement);
            const tdButton = createElement('button', '', ['btn', 'btn-outline-danger', 'btn-sm', 'm-1'], tdButtonElement, 'Descartar', {'type': 'button'});
            tdButton.addEventListener('click', () => {
                line.isDiscarded = true;
                trElement.remove();
                if (tbodyElement.childElementCount == 0) {
                    tableDivElement.remove();
                }
                if (tableObject.functionButton) {
                    tableObject.functionButton();
                }
            });
        }
        Object.entries(line.toOrderedObject()).forEach(([key, value]) => {
            if (typeof value == 'number' && value % 1 !== 0) {
                if (key === 'cota' || key === 'cota_comp') {
                    value = value.toFixed(5);
                } else {
                    value = value.toFixed(4);
                }
            }
            const tdElement = createElement('td', '', ['text-end'], trElement, value);
            if (key === 'dif_ult_med' || key === 'dif_penult_med' || key === 'dif_antepenult_med') {
                if (Math.abs(value) >= 1) {
                    tdElement.classList.add('table-danger');
                } else if (Math.abs(value) >= 0.7) {
                    tdElement.classList.add('table-warning');
                }
            }
        });
    });
    scrollTo(0, 0);
}


// Función para crear botones para un itinerario
export function createButtonsGroup(buttonsGroupObject, parentDiv) {
    const buttonsGroupElement = createElement('div', buttonsGroupObject.id, buttonsGroupObject.classes, parentDiv, '', buttonsGroupObject.attributes);
    buttonsGroupObject.buttons.forEach(buttonObject => {
        const buttonElement = createElement('button', buttonObject.id, buttonObject.classes, buttonsGroupElement, buttonObject.text, buttonObject.attributes);
        if (buttonObject.events) {
            buttonObject.events.forEach(event => {
                buttonElement.addEventListener(event.name, event.function);
            });
        }
    });
}


// Función para formatear las fechas y horas
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}