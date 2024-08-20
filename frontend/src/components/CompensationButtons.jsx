import { useEffect, useState } from 'react'
import { Form, useFetcher } from 'react-router-dom'
import * as math from 'mathjs'

import { useGsi } from '../components/GsiContext'
import { createMatrixA, createMatrixL, createMatrixP } from '../services/gsiServices'

const CompensationButtons = ({ itinerario }) => {
  const { gsiData, setGsiData } = useGsi()
  const [showLeastSquaresForm, setShowLeastSquaresForm] = useState({})
  const [selectedItinerarios, setSelectedItinerarios] = useState([])
  const [selectedNomsCampo, setSelectedNomsCampo] = useState([])

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

  useEffect(() => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map((tooltipTriggerEl) => {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
  }, [])

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
      setSelectedNomsCampo(prev => {
        const nomsCampoItinerario = getNomsCampo(numItinerario)
        return prev.filter(nom_campo => !nomsCampoItinerario.includes(nom_campo))
      })
    }
  }

  const handleNomCampoSelection = (event) => {
    console.log(event.target)
    console.log(event.target.value)
    if (event.target.checked) {
      setSelectedNomsCampo(prev => [...prev, event.target.value])
    } else {
      setSelectedNomsCampo(prev => prev.filter(nom_campo => nom_campo !== event.target.value))
    }
  }

  const handleLeastSquaresSubmit = (event) => {
    const desniveles = selectedItinerarios.reduce((acc, curr) => {
      const desnivelesItinerario = gsiData.itinerarios.find(it => it.numItinerario === curr).tabla_desniveles
      return [...acc, ...desnivelesItinerario]
    }, [])
    const lineasGsi = selectedItinerarios.reduce((acc, curr) => {
      const lineasItinerario = gsiData.itinerarios.find(it => it.numItinerario === curr).lineas
      return [...acc, ...lineasItinerario]
    }, [])
    const cotasBases = selectedNomsCampo.reduce((acc, curr) => {
      const lineaGsiBase = lineasGsi.find(linea => linea.nom_campo === curr && linea.cota)
      console.log(lineaGsiBase)
      return [...acc, lineaGsiBase.cota]
    }, [])
    console.log(cotasBases)

    const matrixA = createMatrixA(desniveles, selectedNomsCampo)
    const matrixL = createMatrixL(desniveles, cotasBases)
    const matrixP = createMatrixP(desniveles, selectedNomsCampo)
    console.log(matrixA)
    console.log(matrixL)
    console.log(matrixP)

    const matrixAT = math.transpose(matrixA)
    const matrixN = math.multiply(matrixAT, math.multiply(matrixP, matrixA))
    const matrixNinv = math.inv(matrixN)
    const matrixT = math.multiply(matrixAT, math.multiply(matrixP, matrixL))
    const matrixX = math.multiply(matrixNinv, matrixT)
    console.log(matrixX)
  }

  const compIsDisabled = () => {
    return 'metodo_comp' in gsiData.itinerarios.find(it => it.numItinerario === itinerario)
  }

  const renderCompensarButton = () => {
    const isDisabled = selectedNomsCampo.length === 0
    const buttonContent = (
      <button className="btn btn-primary btn-sm w-100" disabled={isDisabled} onClick={handleLeastSquaresSubmit}>
        Compensar
      </button>
    )

    if (isDisabled) {
      return (
        <span
          className="d-inline-block w-100"
          tabIndex="0"
          data-bs-toggle="tooltip"
          data-bs-placement="top"
          title="Antes debes seleccionar alguna base de algún itinerario"
        >
          {buttonContent}
        </span>
      )
    }

    return buttonContent
  }

  const getNomsCampo = (numItinerario) => {
    const setNomsCampo = gsiData.itinerarios.find(it => it.numItinerario === numItinerario).lineas.reduce((acc, val) => {
      acc.add(val.nom_campo)
      return acc
    }, new Set())
    return [...setNomsCampo].sort()
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
          disabled={compIsDisabled()}
        />
        <label
          className="btn btn-outline-primary"
          htmlFor={`simple-comp-${itinerario}`}
        >
          Anillo cerrado simple
        </label>
        {/* <input
          type="radio"
          className="btn-check"
          name={`btnradio-${itinerario}`}
          id={`matrix-comp-${itinerario}`}
          autoComplete="off"
          onClick={handleLeastSquaresCompensation}
          disabled={compIsDisabled()}
        />
        <label
          className="btn btn-outline-primary"
          htmlFor={`matrix-comp-${itinerario}`}
        >
          Ajuste por mínimos cuadrados
        </label> */}
        <input
          type="radio"
          className="btn-check"
          name={`btnradio-${itinerario}`}
          id={`none-comp-${itinerario}`}
          autoComplete="off"
          onClick={handleNoneCompensation}
          disabled={compIsDisabled()}
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
              {renderCompensarButton()}
              <Form onSubmit={handleLeastSquaresSubmit}>
                {selectedItinerarios.sort().map(itNum => (
                  <div key={`nom-campo-it-${itNum}`} className="mt-3">
                    <h6>Itinerario {itNum}</h6>
                    <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
                      {getNomsCampo(itNum).map((nom_campo, index) => (
                        <div key={`linea-${itNum}-${index}`} className="col">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`nom-campo-${itNum}-${index}`}
                              value={nom_campo}
                              onChange={handleNomCampoSelection}
                              checked={selectedNomsCampo.includes(nom_campo)} />
                            <label htmlFor={`nom-campo-${itNum}-${index}`} className="form-check-label">
                              {nom_campo}
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
