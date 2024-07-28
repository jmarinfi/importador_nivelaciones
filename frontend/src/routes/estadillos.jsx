import { useLoaderData, Outlet } from 'react-router-dom'

import { getListasEstadillos } from '../services/estadillosServices'
import AccordionEstadillos from '../components/AccordionEstadillos'

export async function loader() {
    const listasEstadillos = await getListasEstadillos()
    return { listasEstadillos }
}

const Estadillos = () => {
    const { listasEstadillos } = useLoaderData()

    return (
        <>
            <h1 className='container display-3 mb-3 mt-3'>Estadillos</h1>
            <Outlet />
            <AccordionEstadillos listas={listasEstadillos} />
        </>

    )
}

export default Estadillos