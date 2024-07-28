import { useGsi } from '../components/GsiContext'
import CardsGsi from '../components/CardsGsi'
import CompensationButtons from '../components/CompensationButtons'
import Table from '../components/Table'

const Gsi = () => {
  const { gsiData, setGsiData, gsiCompensatedData, setGsiCompensatedData } = useGsi()

  const renderTableCompensated = (numItinerario, gsiCompensatedData) => {
    const itinerario = gsiCompensatedData.itinerarios.filter((itinerario) => itinerario.numItinerario === numItinerario)
    return (
      <Table header={itinerario.encabezado} lines={itinerario.lineas} />
    )
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
      {gsiData && gsiData.itinerarios.map((itinerario) => {
        return (
          <div key={`itinerario-${itinerario.numItinerario}`} className='container'>
            <h2 className='display-6 mb-3'>{`Itinerario ${itinerario.numItinerario}`}</h2>
            <CardsGsi cards={itinerario.cards} />
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