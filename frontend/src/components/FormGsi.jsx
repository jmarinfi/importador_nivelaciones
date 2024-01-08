import { useState } from 'react'
import PropTypes from 'prop-types'


const FormGsi = ({ handleFileChange, onFormSubmit }) => {
    const initialDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
    const initialTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`

    const [date, setDate] = useState(initialDate)
    const [time, setTime] = useState(initialTime)

    const handleSubmit = (event) => {
        event.preventDefault()
        onFormSubmit(date, time)

        setDate(initialDate)
        setTime(initialTime)
    }

    return (
        <div className='container'>
            <form method='POST' className='m-3' onSubmit={handleSubmit}>
                <fieldset>
                    <legend>Importador de Nivelaciones</legend>
                    <div className='form-group'>
                        <label htmlFor="formFile" className='form-label mt-3'>Selecciona el archivo GSI</label>
                        <input type="file" className='form-control' id='formFile' name='formFile' required onChange={handleFileChange} />
                        <label htmlFor="dateInput" className='form-label mt-3'>Fecha de la lectura</label>
                        <input type="date" name="dateInput" id="dateInput" className='form-control' required value={date} onChange={(e) => setDate(e.target.value)} />
                        <label htmlFor="timeInput" className='form-label mt-3'>Hora de la lectura</label>
                        <input type="time" name="timeInput" id="timeInput" className='form-control' step={1} required value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                    <button type="submit" className='btn btn-primary mt-3' id='submit-gsi'>Generar GSI</button>
                </fieldset>
            </form>
        </div>
    )
}

FormGsi.propTypes = {
    handleFileChange: PropTypes.func.isRequired,
    onFormSubmit: PropTypes.func.isRequired
}


export default FormGsi