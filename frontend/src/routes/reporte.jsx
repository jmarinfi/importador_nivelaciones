import { useEffect } from 'react'
import { useGsi } from '../components/GsiContext'

const Reporte = () => {
  const { gsiData, setGsiData } = useGsi()

  useEffect(() => {
    console.log(gsiData)
  }, [gsiData])

  return (
    <>
      {JSON.stringify(gsiData.reporte, null, 2)}
    </>
  )
}

export default Reporte