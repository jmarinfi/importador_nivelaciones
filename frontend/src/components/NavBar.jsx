import { NavLink } from 'react-router-dom'

const NavBar = () => {
  return (
    <nav
      className="navbar navbar-expand-md mb-3"
      style={{ backgroundColor: '#ff6620' }}
    >
      <div className="container-fluid">
        <a className="navbar-brand" style={{ width: '120px' }} href="/">
          <img src="/ofitecoLogo.png" className="rounded w-100"></img>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink to={'/'} className={'nav-link fw-bold'}>
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to={'/estadillos'} className={'nav-link fw-bold'}>
                Estadillos
              </NavLink>
            </li>
          </ul>
          <button type="button" className="btn btn-light">
            <a
              href="https://metrolima.acpofiteco.com/"
              className="nav-link fw-bold"
              target="_blank"
              rel="noreferrer"
            >
              Tunneldata
            </a>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
