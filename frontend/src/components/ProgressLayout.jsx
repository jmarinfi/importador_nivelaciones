import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useGsi } from './GsiContext'

const ProgressLayout = () => {
  const { gsiData } = useGsi()
  const location = useLocation()
  const navigate = useNavigate()

  const isGsiCompensated = gsiData?.itinerarios.every(itinerario => 'metodo_comp' in itinerario)
  const currentPath = location.pathname

  const getProgressWidth = () => {
    switch (currentPath) {
      case '/gsi':
        return '0%'
      case '/reporte':
        return '50%'
      case '/csv':
        return '100%'
      default:
        return '0%'
    }
  }

  const handlePrev = () => {
    if (currentPath === '/reporte') {
      navigate('/gsi')
    }
    if (currentPath === '/csv') {
      navigate('/reporte')
    }
  }

  const handleNext = () => {
    if (currentPath === '/gsi') {
      navigate('/reporte')
    }
    if (currentPath === '/reporte') {
      navigate('/csv')
    }
  }

  return (
    <>
      <div className="container">
        <div className="progress-container mb-3">
          <div className="progress" id="progress" style={{ width: getProgressWidth() }}></div>
          <div className={`circle active`}>GSI</div>
          <div className={`circle ${currentPath === '/reporte' || currentPath === '/csv' ? 'active' : ''}`}>REPORTE</div>
          <div className={`circle ${currentPath === '/csv' ? 'active' : ''}`}>CSV</div>
        </div>
        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-primary flex-fill" id="prev" disabled={currentPath === '/gsi'} onClick={handlePrev}>Retrocede</button>
          <button className="btn btn-primary flex-fill" id="next" disabled={!isGsiCompensated} onClick={handleNext}>{isGsiCompensated ? 'Generar reporte' : 'Compensar itinerarios'}</button>
        </div>
      </div>
      <Outlet />
    </>
  )
}

export default ProgressLayout