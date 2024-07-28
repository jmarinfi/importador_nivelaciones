
const CompensationButtons = ({ itinerario }) => {
  return (
    <>
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
        />
        <label className='btn btn-outline-primary' htmlFor={`none-comp-${itinerario.numItinerario}`}>Sin compensar</label>
      </div>
    </>
  )
}

export default CompensationButtons