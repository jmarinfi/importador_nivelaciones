import { useState } from 'react'
import './bootstrap.css'
import PropTypes from 'prop-types'
import FormGsi from './components/FormGsi'


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
    const [file, setFile] = useState(null)
    const [gsi, setGsi] = useState(null)

    const handleHomeClick = (event) => {
        event.preventDefault()
        setGsi(null)
        setFile(null)
    }

    const handleEstadillosClick = (event) => {
        event.preventDefault()
        console.log('Estadillos');
        // Construir Estadillos
    }

    const handleFileChange = (event) => {
        setFile(event.target.files[0])
    }

    const handleSubmitFile = (date, time) => {
        console.log(file, date, time);
        // Construir GSI
        setGsi('gsi')
    }

    return (
        <div>
            <NavBar handleHome={handleHomeClick} handleEstadillos={handleEstadillosClick} />
            {gsi ? <h1>Tabla GSI</h1> : <FormGsi handleFileChange={handleFileChange} onFormSubmit={handleSubmitFile} />}
        </div>
    )
}


export default App
