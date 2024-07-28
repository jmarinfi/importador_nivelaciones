import { useGsi } from '../components/GsiContext'
import CardsGsi from '../components/CardsGsi'
import CompensationButtons from '../components/CompensationButtons'
import Table from '../components/Table'

const Gsi = () => {
  const { gsiData } = useGsi()

  return (
    <>
      <h1 className="container display-3 mb-3">Tabla GSI</h1>
      {gsiData && gsiData.itinerarios.map((itinerario) => {
        return (
          <div key={`itinerario-${itinerario.numItinerario}`} className='container'>
            <h2 className='display-6 mb-3'>{`Itinerario ${itinerario.numItinerario}`}</h2>
            <CardsGsi cards={itinerario.cards} />
            <CompensationButtons itinerario={itinerario} />
            <Table header={itinerario.encabezado} lines={itinerario.lineas} />
          </div>
        )
      })}
    </>
  )
}

export default Gsi