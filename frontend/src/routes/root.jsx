import {
  Outlet,
  useLocation,
  Form,
} from 'react-router-dom'

import NavBar from '../components/NavBar'
import { getGsi } from '../services/gsiServices'

export async function action({ request }) {
  const formData = await request.formData()
  const updatesGsi = Object.fromEntries(formData)
  const file = updatesGsi.formFile
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
  const gsi = await getGsi(fileContent, updatesGsi.dateInput, updatesGsi.timeInput)
  console.log(gsi)
  return { gsi }
}

const Root = () => {
  const currentDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`

  const location = useLocation()

  return (
    <>
      <NavBar />
      {location.pathname === '/' && (
        <Form action='/gsi' method='post' encType='multipart/form-data' id='gsi-form' className='container mt-3'>
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