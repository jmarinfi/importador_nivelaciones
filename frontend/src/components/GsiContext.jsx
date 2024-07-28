import React, { Children, createContext, useContext, useState } from 'react'

const GsiContext = createContext()

export const GsiProvider = ({ children }) => {
  const [gsiData, setGsiData] = useState(null)
  const [gsiCompensatedData, setGsiCompensatedData] = useState(null)

  return (
    <GsiContext.Provider value={{ gsiData, setGsiData, gsiCompensatedData, setGsiCompensatedData }}>
      {children}
    </GsiContext.Provider>
  )
}

export const useGsi = () => {
  return useContext(GsiContext)
}