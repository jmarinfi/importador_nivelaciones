import {useState, useEffect} from 'react'
import './bootstrap.css'
import PropTypes from 'prop-types'
import FormGsi from './components/FormGsi'
import Notification from './components/Notification'
import Utils from './services/utilsGsi'
import Table from './components/Table'
import CardsGroup from "./components/CardsGsi.jsx"
import Accordion from "./components/Accordion.jsx"


const NavBar = ({handleHome, handleEstadillos}) => {
    return (
        <header>
            <nav className='navbar navbar-expand-lg bg-primary' data-bs-theme="dark">
                <div className='container-fluid'>
                    <a href='' className='navbar-brand' onClick={handleHome}>Inicio</a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                            data-bs-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false"
                            aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className='collapse navbar-collapse' id='navbarColor01'>
                        <ul className='navbar-nav me-auto'>
                            <li className='nav-item'>
                                <a href="" className='nav-link' onClick={handleEstadillos}>Estadillos</a>
                            </li>
                        </ul>
                        <button type="button" className='btn btn-secondary'>
                            <a href={import.meta.env.VITE_URL_TD} className='nav-link text-white-50 d-inline'
                               target='_blank' rel="noreferrer">Tunneldata</a>
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    )
}

NavBar.propTypes = {
    handleHome: PropTypes.func.isRequired,
    handleEstadillos: PropTypes.func.isRequired
}


const App = () => {
    const [showForm, setShowForm] = useState(true)
    const [showGsi, setShowGsi] = useState(false)
    const [showCards, setShowCards] = useState(false)
    const [notification, setNotification] = useState({message: undefined, type: undefined})
    const [file, setFile] = useState(null)
    const [gsi, setGsi] = useState(null)
    const [showListas, setShowListas] = useState(false)
    const [listas, setListas] = useState([])

    const handleHomeClick = (event) => {
        event.preventDefault()
        setGsi(null)
        setFile(null)
        setNotification({message: undefined, type: undefined})
        setShowForm(true)
        setShowGsi(false)
        setShowListas(false)
    }

    const handleEstadillosClick = (event) => {
        event.preventDefault()

        setNotification({message: undefined, type: undefined})
        setShowForm(false)
        setShowGsi(false)
        setShowListas(true)

        Utils.getListasEstadillos()
          .then((data) => {
              console.log(data)
              setListas(data)
          })
          .catch((error) => {
              console.log(error)
              setNotification({
                  message: error.message, type: 'danger'
              })
          })
    }

    const onFileChange = (event) => {
        const file = event.target.files[0]
        if (!file.name.toLowerCase().endsWith('.gsi')) {
            setNotification({message: 'Archivo no válido', type: 'danger'})
            event.target.value = null
            return
        }
        if (file.size === 0) {
            setNotification({message: 'Archivo vacío', type: 'danger'})
            event.target.value = null
            return
        }
        setNotification({message: undefined, type: undefined})
        setFile(file)
    }

    const handleSubmitFile = (date, time) => {
        setNotification({message: undefined, type: undefined})

        Utils.readTextFile(file)
            .then((data) => {
                const gsi = Utils.parseGsi(data, date, time)
                gsi.itinerarios.forEach(itinerario => {
                    itinerario.dist_total = Utils.getDistanciaTotal(itinerario.lineas)
                    itinerario.tolerancia = Utils.getTolerancia(itinerario.lineas)
                    itinerario.error_cierre = Utils.getErrorDeCierre(itinerario.lineas)
                    itinerario.error_km = Utils.getErrorKm(itinerario.lineas)
                    itinerario.matrixes = Utils.getMatrixes(itinerario.lineas, true, [itinerario.lineas[0].nom_campo])
                    itinerario.cards = [
                        {
                            header: 'Distancia Total',
                            data: itinerario.dist_total,
                            unit: 'm',
                            additionalClass: 'bg-primary'
                        },
                        {
                            header: 'Tolerancia',
                            data: itinerario.tolerancia,
                            unit: 'mm',
                            additionalClass: 'bg-primary'
                        },
                        {
                            header: 'Error de Cierre',
                            data: itinerario.error_cierre,
                            unit: 'mm',
                            additionalClass: Math.abs(itinerario.error_cierre) > itinerario.tolerancia ? 'bg-danger' : 'bg-success'
                        },
                        {
                            header: 'Error Km',
                            data: itinerario.error_km,
                            unit: 'mm/Km',
                            additionalClass: itinerario.error_km > 0.3 ? 'bg-danger' : 'bg-success'
                        }
                    ]
                })
                setGsi(gsi)

                setShowForm(false)
                setShowCards(true)
                setShowGsi(true)
            })
            .catch((error) => {
                console.log(error)
                setNotification({
                    message: error.message || 'Error al leer el archivo',
                    type: 'danger'
                })
            })
    }

    useEffect(() => {
        console.log(gsi)
    }, [gsi])

    return (
        <div>
            <NavBar handleHome={handleHomeClick} handleEstadillos={handleEstadillosClick}/>
            <Notification text={notification.message} type={notification.type}/>
            {showForm ? <FormGsi handleFileChange={onFileChange} onFormSubmit={handleSubmitFile}/> : null}
            {showGsi ? gsi.itinerarios.map(itinerario => (
                <div key={`itinerario_${itinerario.numItinerario}`} className={'container'}>
                    <h3 className={'mt-3'}>{`Itinerario ${itinerario.numItinerario}`}</h3>
                    {showCards ? <CardsGroup cards={itinerario.cards}/> : null}
                    <Table
                        key={`itinerario${itinerario.numItinerario}_gsi`}
                        header={itinerario.encabezado}
                        lines={itinerario.lineas}/>
                </div>
            )) : null}
            {showListas ? <Accordion items={listas} /> : null}
        </div>
    )
}


export default App
