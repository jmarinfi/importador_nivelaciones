import { useState, useEffect } from 'react'
import './bootstrap.css'
import PropTypes from 'prop-types'
import FormGsi from './components/FormGsi'
import Notification from './components/Notification'
import Utils from './services/utilsGsi'
import Table from './components/Table'


const NavBar = ({ handleHome, handleEstadillos }) => {
    return (
        <header>
            <nav className='navbar navbar-expand-lg bg-primary' data-bs-theme="dark">
                <div className='container-fluid'>
                    <a href='' className='navbar-brand' onClick={handleHome}>Inicio</a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className='collapse navbar-collapse' id='navbarColor01'>
                        <ul className='navbar-nav me-auto'>
                            <li className='nav-item'>
                                <a href="" className='nav-link' onClick={handleEstadillos}>Estadillos</a>
                            </li>
                        </ul>
                        <button type="button" className='btn btn-secondary'>
                            <a href="https://metrolima.acpofiteco.com/" className='nav-link text-white-50 d-inline' target='_blank' rel="noreferrer">Tunneldata</a>
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
    const [notification, setNotification] = useState({ message: undefined, type: undefined })
    const [file, setFile] = useState(null)
    const [gsi, setGsi] = useState(null)

    const handleHomeClick = (event) => {
        event.preventDefault()
        setGsi(null)
        setFile(null)
        setNotification({ message: undefined, type: undefined })
        setShowForm(true)
        setShowGsi(false)
    }

    const handleEstadillosClick = (event) => {
        event.preventDefault()
        console.log('Estadillos');
        // TODO: Construir Estadillos
    }

    const onFileChange = (event) => {
        const file = event.target.files[0]
        if (!file.name.toLowerCase().endsWith('.gsi')) {
            setNotification({ message: 'Archivo no válido', type: 'danger' })
            event.target.value = null
            return
        }
        if (file.size === 0) {
            setNotification({ message: 'Archivo vacío', type: 'danger' })
            event.target.value = null
            return
        }
        setNotification({ message: undefined, type: undefined })
        setFile(file)
    }

    const handleSubmitFile = (date, time) => {
        setNotification({ message: undefined, type: undefined })
        // TODO: Construir GSI
        Utils.readTextFile(file)
            .then((data) => {
                setShowForm(false)
                setGsi(Utils.parseGsi(data, date, time));
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
        console.log(gsi);
    }, [gsi])

    return (
        <div>
            <NavBar handleHome={handleHomeClick} handleEstadillos={handleEstadillosClick} />
            <Notification text={notification.message} type={notification.type} />
            {showForm ? <FormGsi handleFileChange={onFileChange} onFormSubmit={handleSubmitFile} /> : null}
            {showGsi ? gsi.itinerarios.map(itinerario => (
                <Table
                    key={`itinerario${itinerario.numItinerario}_gsi`}
                    title={`Itinerario ${itinerario.numItinerario}`}
                    header={itinerario.encabezado}
                    lines={itinerario.lineas} />
            )) : null}
        </div>
    )
}


export default App
