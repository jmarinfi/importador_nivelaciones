import { useEffect } from 'react'
import { useGsi } from '../components/GsiContext'
import Table from '../components/Table'

const Reporte = () => {
  const { gsiData, setGsiData } = useGsi()

  useEffect(() => {
    console.log(gsiData)
  }, [gsiData])

  return (
    <div className='container'>
      <Table header={Object.keys(gsiData.reporte[0])} lines={gsiData.reporte} />
    </div>
  )
}

export default Reporte