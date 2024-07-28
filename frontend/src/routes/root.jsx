import { Outlet, useLocation, Form, useNavigate } from 'react-router-dom'

import { useGsi } from '../components/GsiContext'
import NavBar from '../components/NavBar'
import { getGsi } from '../services/gsiServices'

const Root = () => {
  const currentDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`

  const location = useLocation()
  const navigate = useNavigate()
  const { setGsiData } = useGsi()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const data = Object.fromEntries(formData)
    const file = data.formFile
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file input')
    }
    if (!file.name.toLowerCase().endsWith('.gsi')) {
      throw new Error('Archivo no válido')
    }
    if (file.size === 0) {
      throw new Error('Archivo vacío')
    }
    const fileContent = await file.text()
    const gsi = await getGsi(fileContent, data.dateInput, data.timeInput)
    console.log(gsi)
    setGsiData(gsi)

    navigate('/gsi')
  }

  return (
    <>
      <NavBar />
      {location.pathname === '/' && (
        <Form method='post' onSubmit={handleSubmit} id='gsi-form' className='container mt-3'>
          <fieldset>
            <h1 className='display-3 mb-3'>Importador de Nivelaciones</h1>
            <div className='mb-3'>
              <label htmlFor='formFile' className='form-label'>Selecciona el archivo GSI</label>
              <input type='file' className='form-control' id='formFile' name='formFile' required></input>
            </div>
            <div className='mb-3'>
              <label htmlFor='dateInput' className='form-label'>Fecha de la lectura</label>
              <input type='date' name='dateInput' id='dateInput' className='form-control' required defaultValue={currentDate}></input>
            </div>
            <div className='mb-3'>
              <label htmlFor='timeInput' className='form-label'>Hora de la lectura</label>
              <input type='time' name='timeInput' id='timeInput' className='form-control' step={1} required defaultValue={currentTime}></input>
            </div>
            <button type='submit' className='btn btn-primary' id='submit-gsi'>Generar GSI</button>
          </fieldset>
        </Form>
      )}
      <Outlet />
    </>
  )
}

export default Root