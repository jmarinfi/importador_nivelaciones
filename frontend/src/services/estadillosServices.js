const base_url_dev = 'http://localhost:3005/api'
const base_url_prod = '/api'

export const getListasEstadillos = async () => {
    const response = await fetch(`${base_url_dev}/listas`)
    if (!response.ok) {
        throw new Error('Se ha producido un error al obtener las listas')
    }
    return response.json()
}

export const getSensoresLista = async (idLista) => {
    const response = await fetch(`${base_url_dev}/sensores-lista/${idLista}`)
    if (!response.ok) {
        throw new Error('Error al obtener los sensores de la lista')
    }
    return response.json()
}

export const getNombreLista = async (idLista) => {
    const response = await fetch(`${base_url_dev}/nombre-lista/${idLista}`)
    if (!response.ok) {
        throw new Error('Error al obtener el nombre de la lista')
    }
    return response.json()
}