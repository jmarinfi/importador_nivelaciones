import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useGsi } from '../components/GsiContext'
import CardsGsi from '../components/CardsGsi'
import CompensationButtons from '../components/CompensationButtons'
import Table from '../components/Table'
import GrafoItinerario from '../components/GrafoItinerario'
import { getTablaDesniveles } from '../services/gsiServices'

const Gsi = () => {
  const [visibilityState, setVisibilityState] = useState({})
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
            linea.cota_comp = linea.cota
              ? linea.cota -
                (linea.dist_acum * (itinerario.error_cierre / 1000)) /
                  itinerario.dist_total
              : null
            return linea
          })
          return itinerario
        }
        return itinerario
      })
      console.log(itinerariosComp)
      const newGsi = {
        ...gsiData,
        itinerarios: itinerariosComp,
      }
      setGsiData(newGsi)
    }

    if (event.target.id.startsWith('none-comp')) {
      console.log('Sin compensación')
      const itinerariosComp = gsiData.itinerarios.map((itinerario) => {
        if (itinerario.numItinerario === numItinerario) {
          if (itinerario.encabezado.includes('cota_comp')) {
            itinerario.encabezado = itinerario.encabezado.filter(
              (item) => item !== 'cota_comp'
            )
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
        itinerarios: itinerariosComp,
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
        <div className="container alert alert-warning">
          No hay itinerarios. Vuelve al inicio para importar otro GSI.
        </div>
      )}
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
              itinerario={itinerario.numItinerario}
              onHandleClick={handleCompensation}
            />
            {'metodo_comp' in itinerario ? (
              <button
                id={`generar-reporte-${itinerario.numItinerario}`}
                type="button"
                className="container btn btn-primary mb-3"
                onClick={handleGenerarReporte}
              >
                Generar reporte del itinerario {itinerario.numItinerario}
              </button>
            ) : null}
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
      ) && gsiData.itinerarios.length > 1 ? (
        <div className="container">
          <button
            id="generar-reporte-todos"
            type="button"
            className="container btn btn-primary mb-3"
            onClick={handleGenerarReporte}
          >
            Generar reporte de todos los itinerarios
          </button>
        </div>
      ) : null}
    </>
  )
}

export default Gsi
