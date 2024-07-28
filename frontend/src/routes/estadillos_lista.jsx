import { useEffect } from 'react'
import { useLoaderData, useLocation } from 'react-router-dom'

import { getSensoresLista, getNombreLista } from '../services/estadillosServices'
import Estadillo from '../components/Estadillo'

export async function loader({ params }) {
  const [sensoresLista, nombreLista] = await Promise.all([
    getSensoresLista(params.listaId),
    getNombreLista(params.listaId)
  ])
  return { sensoresLista, nombreLista }
}

const EstadillosLista = () => {
  const { sensoresLista, nombreLista } = useLoaderData()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <div className='container'>
        <Estadillo sensores={sensoresLista} lista={nombreLista[0].NOM_LISTA} />
      </div>
    </>
  )
}

export default EstadillosLista