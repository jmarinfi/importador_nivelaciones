import React, { createContext, useContext, useState } from 'react'

const GsiContext = createContext()

export const GsiProvider = ({ children }) => {
  const [gsiData, setGsiData] = useState(null)

  return (
    <GsiContext.Provider value={{ gsiData, setGsiData }}>
      {children}
    </GsiContext.Provider>
  )
}

export const useGsi = () => {
  return useContext(GsiContext)
}