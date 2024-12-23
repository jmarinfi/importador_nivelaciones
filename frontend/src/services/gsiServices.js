
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

const transformNomCampo = (itinerario, nom_campo) => {
  if (!nom_campo.includes('.') && Number.isInteger(Number(nom_campo)) && Number(nom_campo) < 201) {
    return `I${itinerario}P${nom_campo}`
  }
  return nom_campo
}

// Función para formatear las fechas y horas
function formatDate(date, time) {
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
          encabezado: ['nom_campo', 'dist_mira', 'cota', 'espalda', 'frente', 'radiado', 'med_rep', 'desv_est', 'mediana', 'balance', 'dist_total', 'dist_acum'],
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

        lineaActual.nom_campo = transformNomCampo(itinerarioActual.numItinerario, data.replace(/^0+/, ''))
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

export const getTablaDesniveles = (lineas) => {
  let currPuntoEspalda = {}
  let currPuntoFrente = {}
  return lineas.reduce((acc, currValue) => {
    if (currValue.cota) {
      if (Object.keys(currPuntoEspalda).length > 0 && Object.keys(currPuntoFrente).length > 0) {
        acc.push({
          ...currPuntoEspalda,
          ...currPuntoFrente
        })
      }
      currPuntoFrente = {}
    }
    if (currValue.espalda) {
      currPuntoEspalda.punto_espalda = currValue.nom_campo
      currPuntoEspalda.lectura_espalda = currValue.espalda
      currPuntoEspalda.distancia_espalda = currValue.dist_mira
    }
    if (currValue.frente || currValue.radiado) {
      currPuntoFrente.punto_frente = currValue.nom_campo
      currPuntoFrente.lectura_frente = currValue.frente || currValue.radiado
      currPuntoFrente.distancia_frente = currValue.dist_mira
    }
    return acc
  }, [])
}

export const getGsi = async (content, date, time) => {
  const gsi = parseGsi(content, date, time)
  gsi.itinerarios.forEach(itinerario => {
    itinerario.dist_total = getDistanciaTotal(itinerario.lineas)
    itinerario.tolerancia = getTolerancia(itinerario.lineas)
    itinerario.error_cierre = getErrorDeCierre(itinerario.lineas)
    itinerario.error_km = getErrorKm(itinerario.lineas)
    itinerario.cards = [
      {
        header: 'Distancia Total',
        data: itinerario.dist_total,
        unit: 'm',
        additionalClass: ''
      },
      {
        header: 'Tolerancia',
        data: itinerario.tolerancia,
        unit: 'mm',
        additionalClass: ''
      },
      {
        header: 'Error de Cierre',
        data: itinerario.error_cierre,
        unit: 'mm',
        additionalClass: Math.abs(Number(itinerario.error_cierre)) > itinerario.tolerancia ? 'bg-danger' : 'bg-success'
      },
      {
        header: 'Error Km',
        data: itinerario.error_km,
        unit: 'mm/Km',
        additionalClass: itinerario.error_km > 0.3 ? 'bg-danger' : 'bg-success'
      }
    ]
    itinerario.tabla_desniveles = getTablaDesniveles(itinerario.lineas)
  })
  return gsi
}

export const createMatrixA = (desniveles, nomBases) => {
  // Crea lista con todos los diferentes nombres de punto
  console.log(desniveles)
  console.log(nomBases)
  const puntos = [...new Set([
    ...desniveles.map(row => row.punto_espalda),
    ...desniveles.map(row => row.punto_frente)
  ])].sort()
  console.log(puntos)

  let matrizA = []

  // Llena la matriz A con los coeficientes de las ecuaciones de los desniveles
  for (let i = 0; i < desniveles.length; i++) {
    let filatemp = new Array(puntos.length).fill(0)
    filatemp[puntos.indexOf(desniveles[i].punto_espalda)] = -1
    filatemp[puntos.indexOf(desniveles[i].punto_frente)] = 1
    matrizA.push(filatemp)
  }

  // Añade a la matriz A los coeficientes de las ecuaciones de los puntos con cota conocida
  for (let base of nomBases) {
    let filatemp = new Array(puntos.length).fill(0)
    filatemp[puntos.indexOf(base)] = 1
    matrizA.push(filatemp)
  }

  return matrizA
}

export const createMatrixL = (desniveles, cotaBases) => {
  const matrixL = []

  for (let i = 0; i < desniveles.length; i++) {
    matrixL.push(desniveles[i].lectura_espalda - desniveles[i].lectura_frente)
  }

  matrixL.push(...cotaBases)

  return matrixL
}

export const createMatrixP = (desniveles, nomBases) => {
  const segundosSexToRadianes = segundosSex => (segundosSex / 3600) * Math.PI / 180
  const calcularPeso = (precCompensadorRad, precPunteriaRad, distEspalda, distFrente) => {
    const precTotal = Math.sqrt(precCompensadorRad ** 2 + precPunteriaRad ** 2)
    const desvEstEspalda = precTotal * distEspalda
    const desvEstFrente = precTotal * distFrente
    const desvEstDesnivel = Math.sqrt(desvEstEspalda ** 2 + desvEstFrente ** 2)
    const errorCuadr = desvEstDesnivel ** 2
    return 1 / errorCuadr
  }

  // Crear la matriz P
  const matrixP = []
  const totalFilas = desniveles.length + nomBases.length

  for (let i = 0; i < totalFilas; i++) {
    const fila = new Array(totalFilas).fill(0)

    if (i < desniveles.length) {
      // Calcular el peso para cada desnivel
      const peso = calcularPeso(
        segundosSexToRadianes(0.3),
        segundosSexToRadianes(0),
        desniveles[i].distancia_espalda,
        desniveles[i].distancia_frente
      )
      fila[i] = peso
    } else {
      // Asignar peso fijo a las bases
      fila[i] = calcularPeso(
        segundosSexToRadianes(0.3),
        segundosSexToRadianes(0),
        1,
        1
      )
    }

    matrixP.push(fila)
  }
  
  return matrixP
}