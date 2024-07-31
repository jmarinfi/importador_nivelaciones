import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useGsi } from '../components/GsiContext'
import CardsGsi from '../components/CardsGsi'
import CompensationButtons from '../components/CompensationButtons'
import Table from '../components/Table'

const Gsi = () => {
  const navigate = useNavigate()
  const { gsiData, setGsiData, gsiCompensatedData, setGsiCompensatedData } = useGsi()

  useEffect(() => {
    if (!gsiData) {
      navigate('/')
    }
  }, [gsiData, navigate])

  const renderTableCompensated = (numItinerario) => {
    const itinerario = gsiCompensatedData.itinerarios.filter((itinerario) => itinerario.numItinerario === Number(numItinerario))
    console.log(numItinerario, itinerario)
    return (
      <Table header={itinerario.encabezado} lines={itinerario.lineas} />
    )
  }

  const handleDescartaItinerario = (event) => {
    const numItinerario = Number(event.target.id)
    console.log(numItinerario)

    const filterItinearios = (data) =>
      data.itinerarios.filter((itinerario) => itinerario.numItinerario !== numItinerario)

    if (gsiData) {
      const newGsiData = {
        ...gsiData,
        itinerarios: filterItinearios(gsiData)
      }
      console.log(newGsiData)
      setGsiData(newGsiData)
    }
    if (gsiCompensatedData) {
      const newGsiCompensatedData = {
        ...gsiCompensatedData,
        itinerarios: filterItinearios(gsiCompensatedData)
      }
      console.log(newGsiCompensatedData)
      setGsiCompensatedData(newGsiCompensatedData)
    }
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
    console.log(event.target.id)
    const numItinerario = Number(event.target.id.slice(-1))
    const itinerario = gsiData.itinerarios.filter((it) => it.numItinerario === numItinerario)[0]
    console.log(itinerario)
    const compensatedItinerario = {
      ...itinerario,
      encabezado: [...itinerario.encabezado, 'cota_compensada']
    }
    console.log(compensatedItinerario)

    if (event.target.id.startsWith('simple-comp')) {

      compensatedItinerario.lineas = itinerario.lineas.map((linea) => {
        return {
          ...linea,
          cota_compensada: linea.cota ? linea.cota - (linea.dist_acum * (itinerario.error_cierre / 1000) / itinerario.dist_total) : null
        }
      })
      compensatedItinerario.tipo_compensacion = 'simple-comp'
      console.log(compensatedItinerario)

      if (gsiCompensatedData) {
        const newGsiCompensatedData = {
          ...gsiCompensatedData,
          itinerarios: gsiCompensatedData.itinerarios.reduce((accumulator, currentValue) => {
            if (compensatedItinerario.numItinerario !== currentValue.numItinerario) {
              accumulator.push(currentValue)
            }
            return accumulator
          }, [])
        }
        newGsiCompensatedData.itinerarios.push(compensatedItinerario)
        console.log(newGsiCompensatedData)
        setGsiCompensatedData(newGsiCompensatedData)
      } else {
        const newGsiCompensatedData = {
          ...gsiData,
          itinerarios: [compensatedItinerario]
        }
        console.log(newGsiCompensatedData)
        setGsiCompensatedData(newGsiCompensatedData)
      }
    }
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
            {
              gsiCompensatedData && gsiCompensatedData.itinerarios.filter((it) => it.numItinerario === itinerario.numItinerario)[0]
                ? <Table
                  header={gsiCompensatedData.itinerarios.filter((it) => it.numItinerario === itinerario.numItinerario)[0].encabezado}
                  lines={gsiCompensatedData.itinerarios.filter((it) => it.numItinerario === itinerario.numItinerario)[0].lineas}
                />
                : <Table header={itinerario.encabezado} lines={itinerario.lineas} onChangeGsi={(newLines) => handleGsiChange(newLines, itinerario.numItinerario)} />
            }
          </div>
        )
      })}
    </>
  )
}

export default Gsi