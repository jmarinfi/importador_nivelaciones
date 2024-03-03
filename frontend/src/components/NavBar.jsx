import PropTypes from 'prop-types'

const NavBar = ({ handleHome, handleEstadillos }) => {
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

export default NavBar