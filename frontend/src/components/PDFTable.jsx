import { StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  tableContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 2,
    borderWidth: 0.25,
    borderColor: 'black',
  },
  headerContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.25,
    borderColor: 'black',
    alignItems: 'center',
    height: 12,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 6,
    flexGrow: 1,
    backgroundColor: '#D3D3D3',
  },
  nomSensor: {
    width: '20%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    paddingTop: 2,
  },
  nomCampo: {
    width: '10%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    paddingTop: 2,
  },
  ultCota: {
    width: '8%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    paddingTop: 2,
  },
  comentario: {
    width: '62%',
    height: 12,
    paddingTop: 2,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.25,
    alignItems: 'center',
    height: 12,
    fontFamily: 'Helvetica',
    fontSize: 6,
  },
  lastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 12,
    fontFamily: 'Helvetica',
    fontSize: 6,
  },
  nomSensorS: {
    width: '17%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    fontSize: 6,
    textAlign: 'center',
    paddingTop: 2,
  },
  nomCampoS: {
    width: '9%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    fontSize: 6,
    paddingTop: 2,
  },
  ultCotaS: {
    width: '8%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    fontSize: 6,
    paddingTop: 2,
  },
  blank: {
    width: '8.5%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    fontSize: 6,
    paddingTop: 2,
  },
  ultFechaS: {
    width: '6.5%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    fontSize: 6,
    paddingTop: 2,
  },
  ultFechaFueraRangoS: {
    width: '6.5%',
    height: 12,
    borderRightWidth: 0.25,
    borderColor: 'black',
    fontSize: 6,
    backgroundColor: '#ff9191',
    paddingTop: 2,
  },
  estAlarmaS: {
    width: '17%',
    height: 12,
    fontSize: 6,
    paddingTop: 2,
  }
})

const PDFTableBasesRows = ({ filas }) => {
  return filas.map((fila, index) => (
    <View key={fila.ID_SENSOR} style={index === filas.length - 1 ? styles.lastRow : styles.row}>
      <Text style={[styles.nomSensor, { paddingLeft: 4 }]}>{fila.NOM_SENSOR ? fila.NOM_SENSOR : ' '}</Text>
      <Text style={[styles.nomCampo, { paddingLeft: 4 }]}>{fila.ID_EXTERNO ? fila.ID_EXTERNO : ' '}</Text>
      <Text style={[styles.ultCota, { paddingLeft: 4 }]}>{fila.ULT_LECT ? fila.ULT_LECT : ' '}</Text>
      <Text style={[styles.comentario, { paddingLeft: 4 }]}>{fila.COMENTARIO ? fila.COMENTARIO : ' '}</Text>
    </View>
  ))
}

const PDFTableBasesHeader = () => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.nomSensor}>NOM SENSOR</Text>
      <Text style={styles.nomCampo}>NOM CAMPO</Text>
      <Text style={styles.ultCota}>ULT COTA</Text>
      <Text style={styles.comentario}>DESCRIPCIÓN</Text>
    </View>
  )
}

const PDFTableBases = ({ filas }) => {
  return (
    <View style={styles.tableContainer}>
      <PDFTableBasesHeader />
      <PDFTableBasesRows filas={filas} />
    </View>
  )
}

const PDFTableSensoresHeader = () => {
  return (
    <View style={styles.headerContainer} fixed={true}>
      <Text style={styles.nomSensorS}>NOM SENSOR</Text>
      <Text style={styles.nomCampoS}>NOM CAMPO</Text>
      <Text style={styles.ultCotaS}>ULT COTA</Text>
      <Text style={styles.blank}> </Text>
      <Text style={styles.blank}> </Text>
      <Text style={styles.blank}> </Text>
      <Text style={styles.blank}> </Text>
      <Text style={styles.blank}> </Text>
      <Text style={styles.ultFechaS}>ULT FECHA</Text>
      <Text style={styles.estAlarmaS}>EST INC</Text>
    </View>

  )
}

const PDFTableSensoresRows = ({ filas }) => {
  const precision = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }

  const getEstadoIncidencia = (idEstado) => {
    switch (idEstado) {
    case '7':
      return 'Incidencia abierta'
    case '10':
      return 'Cerrada por proceso constructivo'
    }
  }

  const fechaMasReciente = filas.reduce((acc, fila) => {
    const fechaFila = new Date(fila.ULT_FECHA)
    return fechaFila > acc ? fechaFila : acc
  }, 0)

  const styleFecha = (fecha, fechaMaxima) => {
    const diferenciaHoras = (fechaMaxima - fecha) / (60 * 60 * 1000)
    if (diferenciaHoras < 4) {
      return [styles.ultFechaS, { paddingLeft: 4 }]
    }
    return [styles.ultFechaFueraRangoS, { paddingLeft: 4 }]
  }

  return filas.map((fila, index) => (
    <View key={fila.ID_SENSOR} style={index === filas.length - 1 ? styles.lastRow : styles.row} wrap={false}>
      <Text style={[styles.nomSensorS, { paddingLeft: 4 }]}>{fila.NOM_SENSOR ? fila.NOM_SENSOR : ' '}</Text>
      <Text style={[styles.nomCampoS, { paddingLeft: 4 }]}>{fila.ID_EXTERNO ? fila.ID_EXTERNO : ' '}</Text>
      <Text style={[styles.ultCotaS, { paddingLeft: 4 }]}>{fila.ULT_LECT ? fila.ULT_LECT : ' '}</Text>
      <Text style={[styles.blank, { paddingLeft: 4 }]}>{' '}</Text>
      <Text style={[styles.blank, { paddingLeft: 4 }]}>{' '}</Text>
      <Text style={[styles.blank, { paddingLeft: 4 }]}>{' '}</Text>
      <Text style={[styles.blank, { paddingLeft: 4 }]}>{' '}</Text>
      <Text style={[styles.blank, { paddingLeft: 4 }]}>{' '}</Text>
      <Text style={fila.ULT_FECHA ? styleFecha(new Date(fila.ULT_FECHA), fechaMasReciente) : [styles.ultFechaS, { paddingLeft: 4 }]}>{fila.ULT_FECHA ? (new Date(fila.ULT_FECHA)).toLocaleString('es-Es', precision) : ' '}</Text>
      <Text style={[styles.estAlarmaS, { paddingLeft: 4 }]}>{fila.ESTADO_ALARMA ? getEstadoIncidencia(fila.ESTADO_ALARMA.toString()) : ' '}</Text>
    </View>
  ))
}

const PDFTableSensores = ({ filas }) => {
  return (
    <View style={styles.tableContainer}>
      <PDFTableSensoresHeader />
      <PDFTableSensoresRows filas={filas} />
    </View>
  )
}

export {
  PDFTableBases,
  PDFTableSensores
}