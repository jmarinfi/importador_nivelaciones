const base_url = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005/api'
    : '/api'

const getNomsSensores = async (nomsCampo) => {
    const response = await fetch(`${base_url}/noms-sensores`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomsCampo }),
    })

    if (!response.ok) {
        throw new Error('Error de red en la petición de nombres de sensores.')
    }

    return response.json()
}

const getTresUltimasLecturas = async (nomsSensores) => {
    const response = await fetch(`${base_url}/tres-ultimas-lecturas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomsSensores }),
    })

    if (!response.ok) {
        throw new Error('Error de red en la petición de las tres últimas lecturas.')
    }

    return response.json()
}

export const getReporte = async (gsiData) => {
    const nomsSensores = await getNomsSensores(
        gsiData.itinerarios.map(itinerario => itinerario.lineas.map(linea => linea.nom_campo)).flat()
    )

    const nomsSensoresArray = nomsSensores.map(sensor => sensor.NOM_SENSOR)

    const tresUltimasLecturas = await getTresUltimasLecturas(nomsSensoresArray)

    return tresUltimasLecturas
}