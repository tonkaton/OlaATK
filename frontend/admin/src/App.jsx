import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import { APP_CONFIG } from './config/constants'

function RequireAdmin({ children }) {
  const navigate = useNavigate()
  const userData = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.USER_DATA)
  
  let isAdmin = false
  if (userData) {
    try {
      const user = JSON.parse(userData)
      isAdmin = user.userType === 'admin'
      
      // If userType is 'user', redirect to user homepage
      if (user.userType === 'user') {
        window.location.href = '/'
        return null
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
    }
  }
  
  useEffect(() => {
    // Check if user is logged in but not as admin
    if (!isAdmin && userData) {
      try {
        const user = JSON.parse(userData)
        // If userType is 'user', redirect to user homepage
        if (user.userType === 'user') {
          window.location.href = '/'
          return
        }
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [isAdmin, userData, navigate])

  return isAdmin ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<AdminLogin />} />

        {/* DASHBOARD */}
        <Route
          path="/*"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </div>
  )
}
