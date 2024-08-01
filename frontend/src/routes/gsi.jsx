import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useGsi } from '../components/GsiContext'
import CardsGsi from '../components/CardsGsi'
import CompensationButtons from '../components/CompensationButtons'
import Table from '../components/Table'

const Gsi = () => {
  const navigate = useNavigate()
  const { gsiData, setGsiData } = useGsi()

  useEffect(() => {
    if (!gsiData) {
      navigate('/')
    }
  }, [gsiData, navigate])

  const handleDescartaItinerario = (event) => {
    const numItinerario = Number(event.target.id)
    console.log(numItinerario)

    const filterItinearios = (data) =>
      data.itinerarios.filter((itinerario) => itinerario.numItinerario !== numItinerario)

    const newGsiData = {
      ...gsiData,
      itinerarios: filterItinearios(gsiData)
    }
    console.log(newGsiData)
    setGsiData(newGsiData)
  }

  const handleGsiChange = (newLines, numItinerario) => {
    const newGsiData = {
      ...gsiData,
      itinerarios: gsiData.itinerarios.map((itinerario) =>
        itinerario.numItinerario === numItinerario
          ? { ...itinerario, lineas: newLines }
          : itinerario
      )
    }
    console.log(newGsiData)
    setGsiData(newGsiData)
  }

  const handleCompensation = (event) => {
    const numItinerario = Number(event.target.id.slice(-1))
    console.log(numItinerario)

    if (event.target.id.startsWith('simple-comp')) {
      console.log('compensación simple')
      const itinerariosComp = gsiData.itinerarios.map((itinerario) => {
        if (itinerario.numItinerario === numItinerario) {
          if (!itinerario.encabezado.includes('cota_comp')) {
            itinerario.encabezado = [...itinerario.encabezado, 'cota_comp']
          }
          itinerario.metodo_comp = 'Anillo simple'
          itinerario.lineas = itinerario.lineas.map((linea) => {
            linea.cota_comp = linea.cota ? linea.cota - (linea.dist_acum * (itinerario.error_cierre / 1000) / itinerario.dist_total) : null
            return linea
          })
          return itinerario
        }
        return itinerario
      })
      console.log(itinerariosComp)
      const newGsi = {
        ...gsiData,
        itinerarios: itinerariosComp
      }
      setGsiData(newGsi)
    }

    if (event.target.id.startsWith('none-comp')) {
      console.log('Sin compensación')
      const itinerariosComp = gsiData.itinerarios.map((itinerario) => {
        if (itinerario.numItinerario === numItinerario) {
          if (itinerario.encabezado.includes('cota_comp')) {
            itinerario.encabezado = itinerario.encabezado.filter((item) => item !== 'cota_comp')
          }
          itinerario.metodo_comp = 'Sin compensar'
          itinerario.lineas = itinerario.lineas.map((linea) => {
            delete linea.cota_comp
            return linea
          })
          return itinerario
        }
        return itinerario
      })
      console.log(itinerariosComp)
      const newGsi = {
        ...gsiData,
        itinerarios: itinerariosComp
      }
      setGsiData(newGsi)
    }
  }

  const handleGenerarReporte = (event) => {
    console.log(event.target.id)
    navigate('/reporte')
  }

  return (
    <>
      <h1 className="container display-3 mb-3">Tabla GSI</h1>
      {gsiData?.itinerarios.length === 0 && (
        <div className='container alert alert-warning'>
          No hay itinerarios. Vuelve al inicio para importar otro GSI.
        </div>
      )}
      {gsiData?.itinerarios.map((itinerario) => {
        return (
          <div key={`itinerario-${itinerario.numItinerario}`} className='container'>
            <h2 className='display-6 mb-3'>{`Itinerario ${itinerario.numItinerario}`}</h2>
            <CardsGsi cards={itinerario.cards} />
            <button type='button' id={itinerario.numItinerario} className='btn btn-primary mb-3' onClick={handleDescartaItinerario}>Descartar itinerario</button>
            <CompensationButtons itinerario={itinerario.numItinerario} onHandleClick={handleCompensation} />
            {'metodo_comp' in itinerario
              ? <button id={`generar-reporte-${itinerario.numItinerario}`} type='button' className='container btn btn-primary mb-3' onClick={handleGenerarReporte}>Generar reporte del itinerario {itinerario.numItinerario}</button>
              : null}
            <Table header={itinerario.encabezado} lines={itinerario.lineas} onChangeGsi={(newLines) => handleGsiChange(newLines, itinerario.numItinerario)} />
          </div>
        )
      })}
      {gsiData?.itinerarios.every(itinerario => 'metodo_comp' in itinerario) && gsiData.itinerarios.length > 1
        ? <div className='container'><button id='generar-reporte-todos' type='button' className='container btn btn-primary mb-3' onClick={handleGenerarReporte}>Generar reporte de todos los itinerarios</button></div>
        : null}
    </>
  )
}

export default Gsi