import React, { useState, useEffect } from 'react'
import { useActionData } from 'react-router-dom'

import CardsGsi from '../components/CardsGsi'
import Table from '../components/Table'

const Gsi = () => {
  const actionData = useActionData()
  const [originalGsiData, setOriginalGsiData] = useState(() => {
    const savedData = sessionStorage.getItem('gsiData')
    return savedData ? JSON.parse(savedData) : null
  })
  const [gsiData, setGsiData] = useState(originalGsiData)

  useEffect(() => {
    if (actionData) {
      console.log(actionData)
      setOriginalGsiData(actionData.gsi)
      sessionStorage.setItem('gsiData', JSON.stringify(actionData.gsi))
    }
  }, [actionData])

  const handleNoneComp = (event) => {
    console.log(event.target.id)
    const numItinerario = Number(event.target.id.slice(-1))
    console.log(numItinerario)
  }

  return (
    <>
      <h1 className="container display-3 mb-3">Tabla GSI</h1>
      {gsiData && gsiData.itinerarios.map((itinerario) => {
        return (
          <div key={`itinerario-${itinerario.numItinerario}`} className='container'>
            <h2 className='display-6 mb-3'>{`Itinerario ${itinerario.numItinerario}`}</h2>
            <CardsGsi cards={itinerario.cards} />
            <h3>Elegir método de compensación</h3>
            <div className='btn-group mb-3' role='group' aria-label='Basic radio toggle button group'>
              <input
                type='radio'
                className='btn-check'
                name={`btnradio-${itinerario.numItinerario}`}
                id={`simple-comp-${itinerario.numItinerario}`}
                autoComplete='off'
              />
              <label className='btn btn-outline-primary' htmlFor={`simple-comp-${itinerario.numItinerario}`}>Anillo cerrado simple</label>
              <input
                type='radio'
                className='btn-check'
                name={`btnradio-${itinerario.numItinerario}`}
                id={`matrix-comp-${itinerario.numItinerario}`}
                autoComplete='off'
              />
              <label className='btn btn-outline-primary' htmlFor={`matrix-comp-${itinerario.numItinerario}`}>Ajuste por mínimos cuadrados</label>
              <input
                type='radio'
                className='btn-check'
                name={`btnradio-${itinerario.numItinerario}`}
                id={`none-comp-${itinerario.numItinerario}`}
                autoComplete='off'
                onChange={handleNoneComp}
              />
              <label className='btn btn-outline-primary' htmlFor={`none-comp-${itinerario.numItinerario}`}>Sin compensar</label>
            </div>
            <Table header={itinerario.encabezado} lines={itinerario.lineas} />
          </div>
        )
      })}
    </>
  )
}

export default Gsi