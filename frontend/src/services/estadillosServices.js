const base_url = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005/api'
    : '/api'

export const getListasEstadillos = async () => {
    const response = await fetch(`${base_url}/listas`)
    if (!response.ok) {
        throw new Error('Se ha producido un error al obtener las listas')
    }
    return response.json()
}

export const getSensoresLista = async (idLista) => {
    const response = await fetch(`${base_url}/sensores-lista/${idLista}`)
    if (!response.ok) {
        throw new Error('Error al obtener los sensores de la lista')
    }
    return response.json()
}

export const getNombreLista = async (idLista) => {
    const response = await fetch(`${base_url}/nombre-lista/${idLista}`)
    if (!response.ok) {
        throw new Error('Error al obtener el nombre de la lista')
    }
    return response.json()
}