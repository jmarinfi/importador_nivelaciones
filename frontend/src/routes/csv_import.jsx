import React, { useState } from 'react'
import Table from '../components/Table'
import Spinner from '../components/Spinner'
import { useGsi } from '../components/GsiContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCsv } from '../services/reportServices'

const CsvImport = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { gsiData, setGsiData } = useGsi()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!gsiData || !gsiData?.csv || gsiData.csv.length === 0) {
      navigate('/')
    }
  }, [gsiData, navigate])

  const handleImportCsv = async () => {
    setIsLoading(true)
    const csv = await uploadCsv(gsiData.csv)
    console.log(csv)
    alert('CSV importado correctamente')
    setIsLoading(false)
    navigate('/')
  }

  return (
    <>{isLoading ? <Spinner /> : (
      gsiData && gsiData.csv && gsiData.csv.length > 0 && (
        <div className='container'>
          <Table header={Object.keys(gsiData?.csv[0])} lines={gsiData?.csv} />
          <button
            id="importar-csv"
            type="button"
            className="container btn btn-primary mb-3"
            onClick={handleImportCsv}
          >
            Importar CSV a la base de datos
          </button>
        </div>
      )
    )}

    </>
  )
}

export default CsvImport