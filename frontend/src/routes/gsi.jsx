import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useGsi } from '../components/GsiContext'
import CardsGsi from '../components/CardsGsi'
import CompensationButtons from '../components/CompensationButtons'
import Table from '../components/Table'
import GrafoItinerario from '../components/GrafoItinerario'
import { getTablaDesniveles } from '../services/gsiServices'
import { getReporte } from '../services/reportServices'
import Spinner from '../components/Spinner'

const Gsi = () => {
  const [visibilityState, setVisibilityState] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { gsiData, setGsiData } = useGsi()

  useEffect(() => {
    if (!gsiData) {
      navigate('/')
    } else {
      const initialVisibility = gsiData.itinerarios.reduce(
        (acc, itinerario) => {
          acc[itinerario.numItinerario] = { showTable: false, showGrafo: false }
          return acc
        },
        {}
      )
      console.log(initialVisibility)
      setVisibilityState(initialVisibility)
    }
  }, [gsiData, navigate])

  const toggleVisibility = (itinerarioNum, key) => {
    setVisibilityState((prevState) => ({
      ...prevState,
      [itinerarioNum]: {
        ...prevState[itinerarioNum],
        [key]: !prevState[itinerarioNum][key],
      },
    }))
  }

  const handleDescartaItinerario = (event) => {
    const numItinerario = Number(event.target.id)
    console.log(numItinerario)

    const newGsiData = {
      ...gsiData,
      itinerarios: gsiData.itinerarios.filter(
        (itinerario) => itinerario.numItinerario !== numItinerario
      ),
    }
    console.log(newGsiData)
    setGsiData(newGsiData)
  }

  const handleGsiChange = (newLines, numItinerario) => {
    const newGsiData = {
      ...gsiData,
      itinerarios: gsiData.itinerarios.map((itinerario) =>
        itinerario.numItinerario === numItinerario
          ? {
            ...itinerario,
            lineas: newLines,
            tabla_desniveles: getTablaDesniveles(newLines),
          }
          : itinerario
      ),
    }
    console.log(newGsiData)
    setGsiData(newGsiData)
  }

  const handleGenerarReporte = async (event) => {
    setIsLoading(true)
    try {
      const reporte = await getReporte(gsiData)

      setGsiData(prevData => ({
        ...prevData,
        reporte: reporte
      }))

      navigate('/reporte')
    } catch (error) {
      console.error('Error al obtener el reporte: ', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading ? <Spinner /> : (
        <>
          {gsiData?.itinerarios.map((itinerario) => {
            return (
              <div
                key={`itinerario-${itinerario.numItinerario}`}
                className="container"
              >
                <h2 className="display-6 mb-3">{`Itinerario ${itinerario.numItinerario}`}</h2>
                <CardsGsi cards={itinerario.cards} />
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    id={itinerario.numItinerario}
                    className="btn btn-primary flex-fill"
                    onClick={handleDescartaItinerario}
                  >
                    Descartar itinerario
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-fill"
                    onClick={() =>
                      toggleVisibility(itinerario.numItinerario, 'showTable')
                    }
                  >
                    {visibilityState[itinerario.numItinerario]?.showTable
                      ? 'Esconder tabla de desniveles'
                      : 'Ver tabla de desniveles'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-fill"
                    onClick={() =>
                      toggleVisibility(itinerario.numItinerario, 'showGrafo')
                    }
                  >
                    {visibilityState[itinerario.numItinerario]?.showGrafo
                      ? 'Esconder grafo del itinerario'
                      : 'Ver grafo del itinerario'}
                  </button>
                </div>
                {visibilityState[itinerario.numItinerario]?.showTable && (
                  <div className="card card-body mb-3">
                    <Table
                      header={Object.keys(itinerario.tabla_desniveles[0])}
                      lines={itinerario.tabla_desniveles}
                    />
                  </div>
                )}

                {visibilityState[itinerario.numItinerario]?.showGrafo && (
                  <GrafoItinerario numItinerario={itinerario.numItinerario} />
                )}

                <CompensationButtons
                  itinerario={itinerario.numItinerario} />
                <Table
                  header={itinerario.encabezado}
                  lines={itinerario.lineas}
                  onChangeGsi={(newLines) =>
                    handleGsiChange(newLines, itinerario.numItinerario)
                  }
                />
              </div>
            )
          })}
          {gsiData?.itinerarios.every(
            (itinerario) => 'metodo_comp' in itinerario
          ) ? (
            <div className="container">
              <button
                id="generar-reporte-todos"
                type="button"
                className="container btn btn-primary mb-3"
                onClick={handleGenerarReporte}
              >
                Generar reporte
              </button>
            </div>
          ) : null}
        </>
      )}

    </>
  )
}

export default Gsi
