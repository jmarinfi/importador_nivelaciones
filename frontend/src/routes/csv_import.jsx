import Table from '../components/Table'
import { useGsi } from '../components/GsiContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const CsvImport = () => {
  const { gsiData, setGsiData } = useGsi()
  const navigate = useNavigate()

  useEffect(() => {
    if (!gsiData || !gsiData?.csv || gsiData.csv.length === 0) {
      navigate('/')
    }
  }, [gsiData, navigate])

  return (
    <>
      {gsiData && gsiData.csv && gsiData.csv.length > 0 && (
        <div className='container'>
          <Table header={Object.keys(gsiData?.csv[0])} lines={gsiData?.csv} />
          <button
            id="importar-csv"
            type="button"
            className="container btn btn-primary mb-3"
            onClick={() => console.log('Importar CSV a la base de datos')}
          >
            Importar CSV a la base de datos
          </button>
        </div>
      )}
    </>
  )
}

export default CsvImport