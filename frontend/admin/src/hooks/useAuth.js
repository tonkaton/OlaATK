import { useState, useEffect } from 'react'
import { APP_CONFIG } from '../config/constants'

export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN)
    const userData = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.USER_DATA)

    setIsAuthenticated(!!token)
    
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUser(user)
        // Check if user is admin based on userType
        setIsAdmin(user.userType === 'admin')
      } catch (e) {
        console.error('Error parsing user data:', e)
        setUser(null)
        setIsAdmin(false)
      }
    } else {
      setUser(null)
      setIsAdmin(false)
    }
  }, [])

  const login = (token, userData, isAdminUser = false) => {
    localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
    // Set isAdmin based on userType in userData
    setIsAdmin(userData.userType === 'admin')
  }

  const logout = () => {
    localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.USER_DATA)
    setIsAuthenticated(false)
    setIsAdmin(false)
    setUser(null)
  }

  return { isAuthenticated, isAdmin, user, login, logout }
}
