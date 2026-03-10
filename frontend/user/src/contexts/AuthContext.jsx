import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { LOCAL_STORAGE_KEYS } from '../config/constants'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load auth state from localStorage on mount
  useEffect(() => {
    loadAuthState()
  }, [])

  const loadAuthState = useCallback(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
    const userData = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_DATA)

    setIsAuthenticated(!!token)
    setUser(userData ? JSON.parse(userData) : null)
    setLoading(false)
  }, [])

  const login = useCallback((token, userData) => {
    console.log('AuthContext: login called', { token: !!token, userData })
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    
    // Update state
    setIsAuthenticated(true)
    setUser(userData)
    
    console.log('AuthContext: state updated')
    
    // Return promise to allow waiting for next render
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('AuthContext: login promise resolved')
        resolve()
      }, 0)
    })
  }, [])

  const logout = useCallback(() => {
    console.log('AuthContext: logout called')
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA)
    setIsAuthenticated(false)
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    login,
    logout
  }), [isAuthenticated, user, loading, login, logout])

  console.log('AuthContext: render', { isAuthenticated, user: !!user, loading })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
