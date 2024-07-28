import React, { Fragment } from 'react'
import {Page, Text, View, Document, StyleSheet, PDFViewer, Image, Font, PDFDownloadLink, pdf} from '@react-pdf/renderer'
import { PDFTableBases, PDFTableSensores } from './PDFTable.jsx'

const Estadillo = ({ sensores, lista }) => {
  const styles = StyleSheet.create({
    viewer: {
      width: '100%',
      height: '70vh',
      marginTop: '20px'
    },
    page: {
      flexDirection: 'column',
      padding: 15,
    },
    header: {
      margin: 5,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerText: {
      flex: 1,
      fontFamily: 'Helvetica-Bold',
      fontSize: 14,
    },
    headerImage: {
      width: '120px'
    }
  })

  const bases = sensores.filter(sensor => sensor.ID_SISTEMA === 75)
  const tableBases = bases.length > 0 ? (
    <>
      <Text style={{ fontFamily: 'Helvetica', fontSize: 10, margin: 2 }}>Bases:</Text>
      <PDFTableBases filas={bases} />
    </>
  ) : <Text style={{ fontFamily: 'Helvetica', fontSize: 10, margin: 2 }}>No hay bases</Text>

  const tableSensores = sensores.length > 0 ? (
    <>
      <Text style={{ fontFamily: 'Helvetica', fontSize: 10, margin: 2 }}>Sensores:</Text>
      <PDFTableSensores filas={sensores} />
    </>
  ) : <Text style={{ fontFamily: 'Helvetica', fontSize: 10, margin: 2 }}>No hay sensores</Text>

  const pdfDocument = (
    <Document>
      <Page size={'A4'} style={styles.page}>
        <View style={{ margin: 2 }} fixed={true}>
          <Text style={{
            fontSize: 6,
          }} render={({ pageNumber, totalPages }) => (
            `página ${pageNumber} de ${totalPages}`
          )}></Text>
          <Text style={{
            flex: 1,
            fontSize: 6,
          }}>Fecha de creación: {(new Date()).toLocaleDateString()}</Text>
        </View>
        <View style={styles.header} fixed={true}>
          <Text style={styles.headerText}>{`Estadillo de la lista: ${lista}`}</Text>
          <Image src={`/ofitecoLogo.png`} style={styles.headerImage}></Image>
        </View>
        {tableBases}
        {tableSensores}
      </Page>
    </Document>
  )

  const fechaActual = (new Date()).toLocaleDateString().replaceAll('/', '_')
  const fileName = `estadillo_${lista}_${fechaActual}.pdf`

  return (
    <>
      <PDFDownloadLink document={pdfDocument} fileName={fileName} type={'button'} className={'btn btn-primary btn-sm mt-3'}>
        {({ blob, url, loading, error }) => (loading ? 'Cargando documento...' : 'Descargar documento')}
      </PDFDownloadLink>
      <PDFViewer style={styles.viewer}>
        {pdfDocument}
      </PDFViewer>
    </>

  )
}

export default Estadillo