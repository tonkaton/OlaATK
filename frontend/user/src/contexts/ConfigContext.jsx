import React, { createContext, useContext, useState, useEffect } from 'react'
import { configAPI } from '../services/api'

const ConfigContext = createContext({})

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider')
  }
  return context
}

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const data = await configAPI.getPublic()
      setConfig(data || {})
      setError(null)
    } catch (err) {
      console.error('Error loading config:', err)
      setError(err.message)
      // Keep config empty if backend is not available
      setConfig({})
    } finally {
      setLoading(false)
    }
  }

  const value = {
    config,
    loading,
    error,
    reload: loadConfig
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}

export default ConfigContext
