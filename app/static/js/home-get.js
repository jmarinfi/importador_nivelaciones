document.addEventListener('DOMContentLoaded', () => {
    const formGsi = document.getElementById('form-gsi');
    const fileInput = document.getElementById('formFile');

    formGsi.addEventListener('submit', (event) => {
        const file = fileInput.files[0];
        const allowedExtensions = ['gsi'];

        // Comprobamos que el nombre del archivo seleccionado tiene extensión
        if (!file.name.includes('.')) {
            alert('El archivo seleccionado no tiene extensión');
            event.preventDefault();
            return;
        }

        // Comprobamos que el nombre del archivo no está vacío
        if (file.name.split('.').shift() === '') {
            alert('El archivo seleccionado no tiene nombre');
            event.preventDefault();
            return;
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();

        // Comprobamos que el archivo seleccionado es un archivo GSI
        if (!allowedExtensions.includes(fileExtension)) {
            alert('El archivo seleccionado no es un archivo GSI');
            event.preventDefault();
            return;
        }
    });
});