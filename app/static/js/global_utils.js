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
export function buildTable(itinerary, parentDiv) {
    const tableDivElement = createElement('div', 'table-div-' + itinerary.numItinerario, ['table-responsive'], parentDiv);
    const tableElement = createElement('table', 'table-' + itinerary.numItinerario, ['table', 'table-hover', 'table-dark', 'mt-3'], tableDivElement);
    const theadElement = createElement('thead', 'thead-' + itinerary.numItinerario, [], tableElement);
    const trHeadElement = createElement('tr', 'tr-head-' + itinerary.numItinerario, ['table-primary'], theadElement, '');
    if (!itinerary.linesGsi[0].metodo) {
        const thButtonElement = createElement('th', '', ['text-end'], trHeadElement);
    }
    Object.keys(itinerary.linesGsi[0].toOrderedObject()).forEach(key => {
        const thElement = createElement('th', 'th-head-' + key, ['text-end'], trHeadElement, key);
    });
    const tbodyElement = createElement('tbody', 'tbody-' + itinerary.numItinerario, [], tableElement);
    itinerary.getLines().forEach(line => {
        const trElement = createElement('tr', '', ['text-end'], tbodyElement);
        if (!line.metodo) {
            const tdButtonElement = createElement('td', '', ['text-end'], trElement);
            const tdButton = createElement('button', '', ['btn', 'btn-outline-danger', 'btn-sm', 'm-1'], tdButtonElement, 'Descartar');
        }
        Object.entries(line).forEach(([key, value]) => {
            if (typeof value == 'number' && value % 1 !== 0) {
                value = value.toFixed(4);
            }
            const tdElement = createElement('td', '', ['text-end'], trElement, value);
        });
    });
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