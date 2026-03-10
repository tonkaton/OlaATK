import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Lock, User } from 'lucide-react'
import useForm from '../hooks/useForm'
import { authAPI } from '../services/api'
import { APP_CONFIG } from '../config/constants'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { values, errors, handleChange, handleSubmit } = useForm(
    { username: '', password: '' },
    async (formValues) => {
      setError('')
      setLoading(true)
      
      try {
        // Call backend API with username and password
        const response = await authAPI.login({
          username: formValues.username,
          password: formValues.password
        })
        
        console.log('AdminLogin: response received', response)
        
        // Backend returns { success, data: { token, userType, userId? } }
        if (response.success && response.data?.token && response.data.userType === 'admin') {
          localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN, response.data.token)
          localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify({ 
            userType: response.data.userType,
            userId: response.data.userId 
          }))
          console.log('AdminLogin: localStorage set', {
            token: !!response.data.token,
            userData: { userType: response.data.userType, userId: response.data.userId }
          })
          navigate('/')
        } else {
          setError('Wrong username or password.')
        }
      } catch (err) {
        // Check if it's a 401 error (unauthorized)
        if (err.response?.status === 401) {
          setError('Wrong username or password.')
        } else {
          setError('Login failed. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-startupPurple/90 via-olaBlue/50 to-olaTosca/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-4"
      >
        <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-olaTosca to-olaBlue mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Admin Login</h2>
            <p className="text-slate-600 mt-2">{APP_CONFIG.APP_NAME} Dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={values.username}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent text-slate-900 placeholder-slate-400"
                  placeholder="admin"
                  disabled={loading}
                  required
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent text-slate-900 placeholder-slate-400"
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-olaTosca to-olaBlue text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-white/80">
          © {new Date().getFullYear()} {APP_CONFIG.APP_NAME}. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
