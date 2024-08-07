import { useState } from 'react'
import { Form } from 'react-router-dom'

import { useGsi } from '../components/GsiContext'

const CompensationButtons = ({ itinerario }) => {
  const { gsiData, setGsiData } = useGsi()
  const [showLeastSquaresForm, setShowLeastSquaresForm] = useState(false)

  const handleCompensacionSimple = (event) => {
    console.log('compensación simple')
    console.log(itinerario)
    const itinerariosComp = gsiData.itinerarios.map((it) => {
      if (it.numItinerario === itinerario) {
        if (!it.encabezado.includes('cota_comp')) {
          it.encabezado = [...it.encabezado, 'cota_comp']
        }
        it.metodo_comp = 'Anillo simple'
        it.lineas = it.lineas.map((linea) => {
          linea.cota_comp = linea.cota
            ? linea.cota -
            (linea.dist_acum * (it.error_cierre / 1000)) /
            it.dist_total
            : null
          return linea
        })
        return it
      }
      return it
    })
    const newGsi = {
      ...gsiData,
      itinerarios: itinerariosComp,
    }
    console.log(newGsi)
    setGsiData(newGsi)
  }

  const handleNoneCompensation = (event) => {
    console.log('sin compensación')
    const itinerariosComp = gsiData.itinerarios.map((it) => {
      if (it.numItinerario === itinerario) {
        if (it.encabezado.includes('cota_comp')) {
          it.encabezado = it.encabezado.filter(
            (item) => item !== 'cota_comp'
          )
        }
        it.metodo_comp = 'Sin compensar'
        it.lineas = it.lineas.map((linea) => {
          delete linea.cota_comp
          return linea
        })
        return it
      }
      return it
    })
    const newGsi = {
      ...gsiData,
      itinerarios: itinerariosComp,
    }
    console.log(newGsi)
    setGsiData(newGsi)
  }

  const handleLeastSquaresCompensation = (event) => {
    console.log('Compensación por mínimos cuadrados')
    console.log(itinerario)
    setShowLeastSquaresForm(true)
  }

  const handleLeastSquaresSubmit = (event) => {

  }

  return (
    <>
      <h3>Elegir método de compensación:</h3>
      <div
        className="d-flex btn-group mb-3"
        role="group"
        aria-label="Basic radio toggle button group"
      >
        <input
          type="radio"
          className="btn-check"
          name={`btnradio-${itinerario}`}
          id={`simple-comp-${itinerario}`}
          autoComplete="off"
          onClick={handleCompensacionSimple}
        />
        <label
          className="btn btn-outline-primary"
          htmlFor={`simple-comp-${itinerario}`}
        >
          Anillo cerrado simple
        </label>
        <input
          type="radio"
          className="btn-check"
          name={`btnradio-${itinerario}`}
          id={`matrix-comp-${itinerario}`}
          autoComplete="off"
          onClick={handleLeastSquaresCompensation}
        />
        <label
          className="btn btn-outline-primary"
          htmlFor={`matrix-comp-${itinerario}`}
        >
          Ajuste por mínimos cuadrados
        </label>
        <input
          type="radio"
          className="btn-check"
          name={`btnradio-${itinerario}`}
          id={`none-comp-${itinerario}`}
          autoComplete="off"
          onClick={handleNoneCompensation}
        />
        <label
          className="btn btn-outline-primary"
          htmlFor={`none-comp-${itinerario}`}
        >
          Sin compensar
        </label>
      </div>

      {showLeastSquaresForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">Seleccionar itinerarios:</h5>
            <Form>
              <div className="form-check">
                {gsiData.itinerarios.map((it) => (
                  <div key={`itinerario-${it.numItinerario}`} className="form-check">
                    <input type="checkbox" className="form-check-input" value={''} id={`compensar-mmcc-it-${it.numItinerario}`} />
                    <label htmlFor={`compensar-mmcc-it-${it.numItinerario}`} className="form-check-label">
                      Itinerario {it.numItinerario}
                    </label>
                  </div>
                ))}
              </div>
            </Form>
          </div>
        </div>
      )}
    </>
  )
}

export default CompensationButtons
