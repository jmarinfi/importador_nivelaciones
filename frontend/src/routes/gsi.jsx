import { useEffect } from 'react'
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
  }, [gsiData])

  const renderTableCompensated = (numItinerario, gsiCompensatedData) => {
    const itinerario = gsiCompensatedData.itinerarios.filter((itinerario) => itinerario.numItinerario === numItinerario)
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
            <CompensationButtons itinerario={itinerario} />
            {gsiCompensatedData ? renderTableCompensated(itinerario.numItinerario, gsiCompensatedData) : (
              <Table header={itinerario.encabezado} lines={itinerario.lineas} onChangeGsi={(newLines) => handleGsiChange(newLines, itinerario.numItinerario)} />
            )}
          </div>
        )
      })}
    </>
  )
}

export default Gsi