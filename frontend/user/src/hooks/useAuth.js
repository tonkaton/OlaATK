import { useState, useEffect } from 'react'
import { LOCAL_STORAGE_KEYS } from '../config/constants'

export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
    const userData = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_DATA)

    setIsAuthenticated(!!token)
    setUser(userData ? JSON.parse(userData) : null)
    setLoading(false)
  }, [])

  const login = (token, userData) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA)
    setIsAuthenticated(false)
    setUser(null)
  }

  return { isAuthenticated, user, loading, login, logout }
}
