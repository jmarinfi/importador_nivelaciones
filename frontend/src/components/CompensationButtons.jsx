
const CompensationButtons = ({ itinerario, onHandleClick }) => {
  return (
    <>
      <h3>Elegir método de compensación</h3>
      <div className='btn-group mb-3' role='group' aria-label='Basic radio toggle button group'>
        <input
          type='radio'
          className='btn-check'
          name={`btnradio-${itinerario}`}
          id={`simple-comp-${itinerario}`}
          autoComplete='off'
          onClick={onHandleClick}
        />
        <label className='btn btn-outline-primary' htmlFor={`simple-comp-${itinerario}`}>Anillo cerrado simple</label>
        <input
          type='radio'
          className='btn-check'
          name={`btnradio-${itinerario}`}
          id={`matrix-comp-${itinerario}`}
          autoComplete='off'
          onClick={onHandleClick}
        />
        <label className='btn btn-outline-primary' htmlFor={`matrix-comp-${itinerario}`}>Ajuste por mínimos cuadrados</label>
        <input
          type='radio'
          className='btn-check'
          name={`btnradio-${itinerario}`}
          id={`none-comp-${itinerario}`}
          autoComplete='off'
          onClick={onHandleClick}
        />
        <label className='btn btn-outline-primary' htmlFor={`none-comp-${itinerario}`}>Sin compensar</label>
      </div>
    </>
  )
}

export default CompensationButtons