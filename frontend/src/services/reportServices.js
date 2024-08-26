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

const getUltimaReferencia = async (nomsSensores) => {
    const response = await fetch(`${base_url}/ultima-referencia`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomsSensores }),
    })

    if (!response.ok) {
        throw new Error('Error de red en la petición de la última referencia.')
    }

    return response.json()
}

const getLecturaInicial = async (nomsSensores) => {
    const response = await fetch(`${base_url}/lectura-inicial`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomsSensores }),
    })

    if (!response.ok) {
        throw new Error('Error de red en la petición de la lectura inicial.')
    }

    return response.json()
}

const getTresUltimasMedidas = async (nomsSensores) => {
    const response = await fetch(`${base_url}/tres-ultimas-medidas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomsSensores }),
    })

    if (!response.ok) {
        throw new Error('Error de red en la petición de las tres últimas medidas.')
    }

    return response.json()
}

export const getReporte = async (gsiData) => {
    const cotas = gsiData.itinerarios.flatMap(
        itinerario => itinerario.lineas.filter(
            linea => linea.cota !== null
        ).map(
            linea => ({
                nom_campo: linea.nom_campo,
                cota: linea.cota,
                cota_comp: linea.cota_comp
            })
        )
    )
    const nomsSensores = await getNomsSensores(
        gsiData.itinerarios.map(itinerario => itinerario.lineas.map(linea => linea.nom_campo)).flat()
    )
    console.log(nomsSensores)
    const nomsSensoresArray = nomsSensores.map(sensor => sensor.NOM_SENSOR)

    const valuesConsultas = await Promise.all([
        getTresUltimasLecturas(nomsSensoresArray),
        getUltimaReferencia(nomsSensoresArray),
        getLecturaInicial(nomsSensoresArray),
        getTresUltimasMedidas(nomsSensoresArray),
    ])
    console.log(valuesConsultas)

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString)

        const padZero = (num) => num.toString().padStart(2, '0')

        const day = padZero(date.getDate())
        const month = padZero(date.getMonth() + 1)
        const year = date.getFullYear()
        const hours = padZero(date.getHours())
        const minutes = padZero(date.getMinutes())
        const seconds = padZero(date.getSeconds())

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    }

    const reporte = nomsSensoresArray.reduce((acc, nomSensor) => {
        const tresUltimasLecturas = valuesConsultas[0].find(lectura => lectura.SENSOR === nomSensor)
        const ultimaReferencia = valuesConsultas[1].find(referencia => referencia.SENSOR === nomSensor)
        const lecturaInicial = valuesConsultas[2].find(lectura => lectura.SENSOR === nomSensor)
        const tresUltimasMedidas = valuesConsultas[3].find(medida => medida.SENSOR === nomSensor)
        const nomCampo = nomsSensores.find(sensor => sensor.NOM_SENSOR === nomSensor).ID_EXTERNO

        const cotaEncontrada = cotas.find(cota => cota.nom_campo === nomCampo)
        const objReporte = {
            nom_campo: nomCampo,
            nom_sensor: nomSensor,
            cota: Number(cotas.find(cota => cota.nom_campo === nomCampo).cota),
            cota_comp: cotaEncontrada && cotaEncontrada.cota_comp ? Number(cotaEncontrada.cota_comp) : null,
            fecha_lect_inicial: formatDateTime(lecturaInicial.FECHA_MEDIDA),
            lectura_inicial: Number(lecturaInicial.LECTURA),
            medida_inicial: Number(lecturaInicial.MEDIDA),
            fecha_ult_lect: formatDateTime(tresUltimasLecturas.ULTIMA_FECHA_MEDIDA),
            ult_lectura: Number(tresUltimasLecturas.ULTIMA_LECTURA),
            ult_medida: Number(tresUltimasMedidas.ULTIMA_MEDIDA),
            fecha_penult_lect: formatDateTime(tresUltimasLecturas.PENULTIMA_FECHA_MEDIDA),
            penult_lectura: Number(tresUltimasLecturas.PENULTIMA_LECTURA),
            penult_medida: Number(tresUltimasMedidas.PENULTIMA_MEDIDA),
            fecha_antepenult_lect: formatDateTime(tresUltimasLecturas.ANTEPENULTIMA_FECHA_MEDIDA),
            antepenult_lectura: Number(tresUltimasLecturas.ANTEPENTULTIMA_LECTURA),
            antepenult_medida: Number(tresUltimasMedidas.ANTEPENULTIMA_MEDIDA),
            fecha_ult_referencia: ultimaReferencia?.FECHA_MEDIDA ? formatDateTime(ultimaReferencia.FECHA_MEDIDA) : '',
            lect_ult_referencia: ultimaReferencia?.LECTURA ? Number(ultimaReferencia.LECTURA) : '',
            med_ult_referencia: ultimaReferencia?.MEDIDA ? Number(ultimaReferencia.MEDIDA) : '',
        }

        acc.push(objReporte)

        return acc
    }, [])
    console.log(reporte)

    return reporte
}

export const getCsv = (gsiData) => {
    return gsiData.reporte.map(lineaReporte => ({
        fecha: gsiData.fecha,
        nom_sensor: lineaReporte.nom_sensor,
        lectura: lineaReporte.cota_comp ? lineaReporte.cota_comp : lineaReporte.cota,
    }))
}
