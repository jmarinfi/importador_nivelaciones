import { useEffect } from 'react'
import { useGsi } from '../components/GsiContext'

const CompensationButtons = ({ itinerario }) => {
  const { gsiData, setGsiData } = useGsi()

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

  const compIsDisabled = () => {
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
          disabled={compIsDisabled()}
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
    </>
  )
}

export default CompensationButtons
