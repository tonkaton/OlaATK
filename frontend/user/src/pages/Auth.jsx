import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, LogIn, UserPlus, Phone, MapPin } from 'lucide-react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import useForm from '../hooks/useForm'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  // Login form
  const loginForm = useForm(
    { emailOrPhone: '', password: '' },
    async (values) => {
      try {
        setErrorMessage('')
        if (!values.emailOrPhone || !values.password) {
          setErrorMessage('Email/No. HP dan password harus diisi')
          return
        }

        const response = await authAPI.login({
          username: values.emailOrPhone,
          password: values.password
        })
        
        if (response.success && response.data) {
          // Store token and user data
          await login(response.data.token, {
            userId: response.data.userId,
            userType: response.data.userType
          })
          
          setSuccessMessage('Login berhasil!')
          setTimeout(() => {
            navigate('/')
          }, 1500)
        } else {
          setErrorMessage('Login gagal. Periksa email/no. HP dan password Anda.')
        }
      } catch (error) {
        console.error('Login error:', error)
        setErrorMessage(error.response?.data?.message || 'Login gagal. Silakan coba lagi.')
      }
    }
  )

  // Register form
  const registerForm = useForm(
    { name: '', email: '', phone: '', alamat: '', password: '' },
    async (values) => {
      try {
        setErrorMessage('')
        if (!values.name || !values.email || !values.phone || !values.alamat || !values.password) {
          setErrorMessage('Semua field harus diisi')
          return
        }

        // First, create pelanggan
        const pelangganResponse = await authAPI.registerPelanggan({
          nama_lengkap: values.name,
          nomor_telepon: values.phone,
          alamat: values.alamat
        })

        if (pelangganResponse.success && pelangganResponse.data) {
          const pelangganId = pelangganResponse.data.pelanggan.id

          // Then create akun_pelanggan
          const akunResponse = await authAPI.registerAkun({
            id_pelanggan: pelangganId,
            email: values.email,
            nomor_telepon: values.phone,
            hashed_password: values.password,
            alamat: values.alamat
          })

          if (akunResponse.success) {
            setSuccessMessage('Registrasi berhasil! Silakan login.')
            setTimeout(() => {
              setTab('login')
              setSuccessMessage('')
            }, 2000)
          } else {
            setErrorMessage('Gagal membuat akun. Silakan coba lagi.')
          }
        } else {
          setErrorMessage('Registrasi gagal. Silakan coba lagi.')
        }
      } catch (error) {
        console.error('Registration error:', error)
        setErrorMessage(error.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.')
      }
    }
  )

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Card>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-olaTosca to-olaBlue mb-3 shadow-lg">
              {tab === 'login' ? (
                <LogIn className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {tab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-600 mt-1">
              {tab === 'login' ? 'Sign in to continue' : 'Register to get started'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                tab === 'login'
                  ? 'bg-gradient-to-r from-olaTosca to-olaBlue text-white shadow-md'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-olaTosca to-olaBlue text-white shadow-md'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Register
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Login Form */}
          {tab === 'login' ? (
            <form onSubmit={loginForm.handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-emailOrPhone" className="block text-sm font-medium text-slate-700 mb-1">
                  Email atau No. HP/WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="login-emailOrPhone"
                    name="emailOrPhone"
                    type="text"
                    value={loginForm.values.emailOrPhone}
                    onChange={loginForm.handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent"
                    placeholder="email@example.com atau 08123456789"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    value={loginForm.values.password}
                    onChange={loginForm.handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loginForm.isSubmitting}
              >
                {loginForm.isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          ) : (
            // Register Form
            <form onSubmit={registerForm.handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    value={registerForm.values.name}
                    onChange={registerForm.handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent"
                    placeholder="Nama Lengkap"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-phone" className="block text-sm font-medium text-slate-700 mb-1">
                  Nomor HP/WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    value={registerForm.values.phone}
                    onChange={registerForm.handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent"
                    placeholder="08123456789"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-alamat" className="block text-sm font-medium text-slate-700 mb-1">
                  Alamat
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea
                    id="register-alamat"
                    name="alamat"
                    value={registerForm.values.alamat}
                    onChange={registerForm.handleChange}
                    rows={2}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    value={registerForm.values.email}
                    onChange={registerForm.handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    value={registerForm.values.password}
                    onChange={registerForm.handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olaBlue focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={registerForm.isSubmitting}
              >
                {registerForm.isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  'Register'
                )}
              </Button>
            </form>
          )}

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {tab === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setTab('register')}
                    className="text-olaBlue font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setTab('login')}
                    className="text-olaBlue font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
