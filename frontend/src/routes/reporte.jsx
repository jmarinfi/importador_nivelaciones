import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGsi } from '../components/GsiContext'
import Table from '../components/Table'
import { getCsv } from '../services/reportServices'

const Reporte = () => {
  const { gsiData, setGsiData } = useGsi()
  const navigate = useNavigate()

  const handleDeleteLine = (newLines) => {
    setGsiData(prevData => ({
      ...prevData,
      reporte: newLines
    }))
  }

  const handleCsv = () => {
    const csv = getCsv(gsiData)

    setGsiData(prevData => ({
      ...prevData,
      csv: csv
    }))

    navigate('/csv')
  }

  return (
    <>
      {gsiData?.reporte.length > 0 && (
        <div className='container'>
          <Table header={Object.keys(gsiData.reporte[0])} lines={gsiData.reporte} onDeleteLine={handleDeleteLine} />
          <button
            id="generar-reporte-todos"
            type="button"
            className="container btn btn-primary mb-3"
            onClick={handleCsv}
          >
            Generar CSV
          </button>
        </div>
      )}
    </>
  )
}

export default Reporte