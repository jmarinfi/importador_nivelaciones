import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useGsi } from './GsiContext'
import { getReporte, getCsv } from '../services/reportServices'
import { useEffect, useState } from 'react'
import Spinner from './Spinner'

const ProgressLayout = () => {
  const { gsiData, setGsiData } = useGsi()
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const isGsiCompensated = gsiData?.itinerarios?.every(itinerario => 'metodo_comp' in itinerario)
  const currentPath = location.pathname

  useEffect(() => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map((tooltipTriggerEl) => {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
  }, [])

  useEffect(() => {
    if (!gsiData) {
      navigate('/')
    }
    if (currentPath === '/gsi' && (!gsiData?.itinerarios || gsiData.itinerarios.length === 0)) {
      navigate('/')
    }
    if (currentPath === '/reporte' && (!gsiData?.reporte || gsiData.reporte.length === 0)) {
      navigate('/')
    }
  }, [currentPath, gsiData, navigate])

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

  const handleNext = async () => {
    if (currentPath === '/gsi') {
      setIsLoading(true)
      try {
        const reporte = await getReporte(gsiData)

        setGsiData(prevData => ({
          ...prevData,
          reporte: reporte
        }))

        navigate('/reporte')
      } catch (error) {
        console.error('Error al obtener el reporte: ', error)
      } finally {
        setIsLoading(false)
      }

    }
    if (currentPath === '/reporte') {
      const csv = getCsv(gsiData)

      setGsiData(prevData => ({
        ...prevData,
        csv: csv
      }))
      
      navigate('/csv')
    }
  }

  const getTextNextButton = () => {
    if (currentPath === '/gsi') {
      return 'Generar reporte'
    } else {
      return 'Generar CSV'
    }
  }

  const renderNextButton = () => {
    const isDisabled = (currentPath === '/gsi' && !isGsiCompensated) || (currentPath === '/csv')
    const buttonContent = (
      <button className="btn btn-primary w-100" id="next" disabled={isDisabled} onClick={handleNext}>
        {getTextNextButton()}
      </button>
    )

    if (isDisabled) {
      return (
        <span
          className="d-inline-block w-100"
          tabIndex="0"
          data-bs-toggle="tooltip"
          data-bs-placement="top"
          title="Antes debes compensar los itinerarios"
        >
          {buttonContent}
        </span>
      )
    }

    return buttonContent
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
          <div className="flex-fill">
            <button className="btn btn-primary w-100" id="prev" disabled={currentPath === '/gsi'} onClick={handlePrev}>Retrocede</button>
          </div>
          <div className="flex-fill">
            {renderNextButton()}
          </div>
        </div>
      </div>
      {isLoading ? <Spinner /> : <Outlet />}
    </>
  )
}

export default ProgressLayout