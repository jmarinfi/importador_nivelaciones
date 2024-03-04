import { matrix } from 'mathjs'

const base_url_dev = 'http://localhost:3005'
const base_url_prod = ''

const REGEX_GSI = /([0-9]{2}[0-9.])([0-9.]{3})([+-])([^\s]{8,16})\s/g
const WI_CONSTANTS = {
  'NEW_ITINERARY': '410',
  'NEW_LINE': '110',
  'DIST_MIRA': '32',
  'COTA': '83',
  'ESPALDA': '331',
  'FRENTE': '332',
  'RADIADO': '333',
  'MED_REP': '390',
  'DESV_EST': '391',
  'MEDIANA': '392',
  'BALANCE': '573',
  'DIST_TOTAL': '574'
}


// Método para leer un archivo de texto
const readTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const getMetodo = (data) => {
  switch (data) {
  case '1':
    return 'EF'
  case '2':
    return 'EFFE'
  case '3':
    return 'aEF'
  case '4':
    return 'aEFFE'
  case '10':
    return 'Comprob_y_ajuste'
  default:
    return 'Desconocido'
  }
}

// Función para formatear las fechas y horas
export function formatDate(date, time) {
  const dateObj = new Date(`${date} ${time}`)
  const day = dateObj.getDate()
  const month = dateObj.getMonth() + 1
  const year = dateObj.getFullYear()
  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes()
  const seconds = dateObj.getSeconds()

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

// Método para parsear un GSI a partir de un archivo de texto
const parseGsi = (contentFile, date, time) => {
  const matches = contentFile.matchAll(REGEX_GSI)
  const gsi = {
    fecha: formatDate(date, time),
    itinerarios: []
  }
  let numItinerario = 0
  let itinerarioActual = null
  let lineaActual = null
  let dist_acum = 0

  for (const match of matches) {
    const wordIndex = match[1].replace(/\.+/, '')
    // const infCompl = match[2];
    const signo = match[3]
    const data = match[4].replace(/[.?]+/, '')

    switch (wordIndex) {
    case WI_CONSTANTS.NEW_ITINERARY:
      itinerarioActual = {
        numItinerario: ++numItinerario,
        metodo: getMetodo(data),
        encabezado: ['nom_campo', 'dist_mira', 'cota', 'espalda', 'frente', 'radiado', 'med_rep', 'desv_est', 'mediana', 'balance', 'dist_total', 'dist_acum', 'cota_comp'],
        lineas: []
      }
      gsi.itinerarios.push(itinerarioActual)
      break
    case WI_CONSTANTS.NEW_LINE:
      if (lineaActual) {
        if (itinerarioActual.lineas.length === 1) {
          dist_acum = 0
        }
        if (lineaActual.dist_mira && !lineaActual.radiado) {
          dist_acum += lineaActual.dist_mira
          lineaActual.dist_acum = dist_acum
        } else {
          lineaActual.dist_acum = dist_acum
        }
      }
      lineaActual = itinerarioActual.encabezado.reduce((obj, clave) => {
        obj[clave] = null
        return obj
      }, {})

      lineaActual.nom_campo = data.replace(/^0+/, '')
      itinerarioActual.lineas.push(lineaActual)
      break
    case WI_CONSTANTS.DIST_MIRA:
      lineaActual.dist_mira = parseFloat(signo + data) / 100000
      break
    case WI_CONSTANTS.COTA:
      lineaActual.cota = parseFloat(signo + data) / 100000
      break
    case WI_CONSTANTS.ESPALDA:
      lineaActual.espalda = parseFloat(signo + data) / 100000
      break
    case WI_CONSTANTS.FRENTE:
      lineaActual.frente = parseFloat(signo + data) / 100000
      break
    case WI_CONSTANTS.RADIADO:
      lineaActual.radiado = parseFloat(signo + data) / 100000
      break
    case WI_CONSTANTS.MED_REP:
      lineaActual.med_rep = parseInt(signo + data)
      break
    case WI_CONSTANTS.DESV_EST:
      lineaActual.desv_est = parseInt(signo + data)
      break
    case WI_CONSTANTS.MEDIANA:
      lineaActual.mediana = parseInt(signo + data)
      break
    case WI_CONSTANTS.BALANCE:
      lineaActual.balance = parseFloat(signo + data) / 100000
      break
    case WI_CONSTANTS.DIST_TOTAL:
      lineaActual.dist_total = parseFloat(signo + data) / 100000
      break
    default:
      break
    }
  }

  if (lineaActual) {
    if (lineaActual.dist_mira && !lineaActual.radiado) {
      dist_acum += lineaActual.dist_mira
      lineaActual.dist_acum = dist_acum
    } else {
      lineaActual.dist_acum = dist_acum
    }
  }

  return gsi
}

const getSqrtDistTotal = dist => Math.sqrt(dist / 1000)

const getDistanciaTotal = (lineas) => {
  return lineas[lineas.length - 1].dist_acum.toFixed(4)
}

const getTolerancia = lineas => (0.3 * getSqrtDistTotal(getDistanciaTotal(lineas))).toFixed(4)

const getErrorDeCierre = (lineas) => {
  const cotaInicial = lineas.find(line => line.cota).cota
  const cotaFinal = [...lineas].reverse().find(line => line.cota).cota

  return ((cotaFinal - cotaInicial) * 1000).toFixed(4)
}

const getErrorKm = lineas => Math.abs(getErrorDeCierre(lineas) / getSqrtDistTotal(getDistanciaTotal(lineas))).toFixed(4)

const getMatrixes = (lineas, esCerrado, bases) => {
  const puntos = [...new Set(lineas.map(line => line.nom_campo))].map((punto, index) => {
    return { punto, index }
  })
  if (esCerrado) {
    puntos.pop()
  }
  console.log(puntos)
  let espaldaActual = lineas.find(line => line.espalda)
  let rowMatrix = null

  const matrixes = lineas.reduce((matrixes, line) => {
    if (line.espalda) {
      espaldaActual = line
    }
    if (line.frente || line.radiado) {
      rowMatrix = new Array(puntos.length).fill(0)
      rowMatrix[puntos.find(punto => punto.punto === line.nom_campo)?.index] = 1
      rowMatrix[puntos.find(punto => punto.punto === espaldaActual.nom_campo)?.index] = -1
      matrixes.matrixA.push(rowMatrix)
      const frente = line.frente || line.radiado
      matrixes.matrixL.push(espaldaActual.espalda - frente)
    }
    return matrixes
  }, { matrixA: [], matrixL: [] })

  console.log(matrixes)

  bases.forEach(base => {
    rowMatrix = new Array(puntos.length).fill(0)
    rowMatrix[puntos.find(punto => punto.punto === base)?.index] = 1
    matrixes.matrixA.push(rowMatrix)
    matrixes.matrixL.push(lineas.find(line => line.nom_campo === base)?.cota)
  })

  return { matrixA: matrix(matrixes.matrixA), matrixL: matrix(matrixes.matrixL) }
}

const getListasEstadillos = async () => {
  const response = await fetch(`${base_url_prod}/listas`)
  if (!response.ok) {
    throw new Error('Error al obtener las listas')
  }
  return response.json()
}

const getSensoresLista = async (idLista) => {
  const response = await fetch(`${base_url_prod}/sensores-lista/${idLista}`)
  if (!response.ok) {
    throw new Error('Error al obtener los sensores de la lista')
  }
  return response.json()
}


const Utils = {
  readTextFile,
  parseGsi,
  getDistanciaTotal,
  getTolerancia,
  getErrorDeCierre,
  getErrorKm,
  getMatrixes,
  getListasEstadillos,
  getSensoresLista,
}


export default Utils
