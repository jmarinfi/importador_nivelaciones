import { useEffect, useState } from 'react'
import { Form } from 'react-router-dom'

import { useGsi } from '../components/GsiContext'

const CompensationButtons = ({ itinerario }) => {
  const { gsiData, setGsiData } = useGsi()
  const [showLeastSquaresForm, setShowLeastSquaresForm] = useState({})
  const [selectedItinerarios, setSelectedItinerarios] = useState([])

  useEffect(() => {
    const initialVisibilityForm = gsiData.itinerarios.reduce(
      (acc, itinerario) => {
        acc[itinerario.numItinerario] = { showForm: false }
        return acc
      },
      {}
    )
    console.log(initialVisibilityForm)
    setShowLeastSquaresForm(initialVisibilityForm)
  }, [gsiData])

  const handleCompensacionSimple = (event) => {
    console.log('compensación simple')
    console.log(itinerario)
    const itinerariosComp = gsiData.itinerarios.map((it) => {
      if (it.numItinerario === itinerario) {
        it.encabezado = [...it.encabezado, 'cota_comp']
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
        it.metodo_comp = 'Sin compensar'
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
    console.log(showLeastSquaresForm)
    setShowLeastSquaresForm(prevState => ({
      ...prevState,
      [itinerario]: { showForm: true }
    }))
  }

  const handleItinerarioSelection = (event) => {
    console.log(event.target.checked)
    console.log(event.target.value)
    const numItinerario = parseInt(event.target.value)
    if (event.target.checked) {
      setSelectedItinerarios(prev => [...prev, numItinerario])
    } else {
      setSelectedItinerarios(prev => prev.filter(num => num !== numItinerario))
    }
  }

  const handleLeastSquaresSubmit = (event) => {

  }

  const isDisabled = () => {
    return 'metodo_comp' in gsiData.itinerarios.find(it => it.numItinerario === itinerario)
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
          disabled={isDisabled()}
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
          disabled={isDisabled()}
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
          disabled={isDisabled()}
        />
        <label
          className="btn btn-outline-primary"
          htmlFor={`none-comp-${itinerario}`}
        >
          Sin compensar
        </label>
      </div>

      {showLeastSquaresForm[itinerario]?.showForm && (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Seleccionar itinerarios:</h5>
              <Form>
                <div className="form-check">
                  {gsiData.itinerarios.map((it) => (
                    <div key={`itinerario-${it.numItinerario}`} className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        value={it.numItinerario}
                        id={`compensar-mmcc-it-${itinerario}-${it.numItinerario}`}
                        onChange={handleItinerarioSelection}
                        checked={selectedItinerarios.includes(it.numItinerario)} />
                      <label htmlFor={`compensar-mmcc-it-${itinerario}-${it.numItinerario}`} className="form-check-label">
                        Itinerario {it.numItinerario}
                      </label>
                    </div>
                  ))}
                </div>
                {/* <button type='submit' className="btn btn-sm btn-secondary">Seleccionar itinerarios</button> */}
              </Form>
            </div>
          </div>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Seleccionar bases:</h5>
              <button type='submit' className="btn btn-sm btn-secondary">Compensar</button>
              {selectedItinerarios.length === 0 && <p>Debes seleccionar algún itinerario.</p>}
              <Form onSubmit={handleLeastSquaresSubmit}>
                {selectedItinerarios.sort().map(itNum => (
                  <div key={`nom-campo-it-${itNum}`} className="mt-3">
                    <h6>Itinerario {itNum}</h6>
                    <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
                      {gsiData.itinerarios.find(it => it.numItinerario === itNum).lineas.map((linea, index) => (
                        <div key={`linea-${itNum}-${index}`} className="col">
                          <div className="form-check">
                            <input type="checkbox" className="form-check-input" id={`nom-campo-${itNum}-${index}`} value={linea.nom_campo} />
                            <label htmlFor={`nom-campo-${itNum}-${index}`} className="form-check-label">
                              {linea.nom_campo}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </Form>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default CompensationButtons
