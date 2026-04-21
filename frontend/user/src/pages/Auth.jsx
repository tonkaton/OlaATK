import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import Card from '../components/Card'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Button from '../components/Button'
import useForm from '../hooks/useForm'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // FIX: State untuk fitur mata (Toggle Password)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  
  const navigate = useNavigate()
  const { login } = useAuth()

  // Login form (LOGIC SAMA)
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

  // Register form (LOGIC SAMA)
  const registerForm = useForm(
    { name: '', email: '', phone: '', alamat: '', password: '' },
    async (values) => {
      try {
        setErrorMessage('')
        if (!values.name || !values.email || !values.phone || !values.alamat || !values.password) {
          setErrorMessage('Semua field harus diisi')
          return
        }

        const pelangganResponse = await authAPI.registerPelanggan({
          nama_lengkap: values.name,
          nomor_telepon: values.phone,
          alamat: values.alamat
        })

        if (pelangganResponse.success && pelangganResponse.data) {
          const pelangganId = pelangganResponse.data.pelanggan.id

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
    <div className="min-h-screen bg-light pt-32 pb-20 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card padding="lg" className="border-border">
          {/* Header */}
          <div className="text-center mb-8">
            {/* FIX: Border dan Shadow dihapus biar logo blend-in alami */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 overflow-hidden">
              <img 
                src="/logo3.jpg" 
                alt="Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  // Fallback icon kalau gambar gagal ngeload
                  e.target.insertAdjacentHTML('afterend', `<i class="solar:user-circle-bold text-3xl text-dark"></i>`);
                }}
              />
            </div>
            <h2 className="font-display text-2xl font-medium text-dark">
              {tab === 'login' ? 'Welcome Back' : 'Buat Akun'}
            </h2>
            <p className="text-neutral-text mt-2 text-sm">
              {tab === 'login' ? 'Masuk untuk melanjutkan' : 'Daftar untuk memulai'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 px-4 py-2.5 rounded-full font-normal text-sm transition-colors ${
                tab === 'login'
                  ? 'bg-dark text-white shadow-sm'
                  : 'border border-border text-neutral-text hover:bg-light-gray'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 px-4 py-2.5 rounded-full font-normal text-sm transition-colors ${
                tab === 'register'
                  ? 'bg-dark text-white shadow-sm'
                  : 'border border-border text-neutral-text hover:bg-light-gray'
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
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2"
            >
              <Icon icon="solar:check-circle-bold" className="text-lg shrink-0" />
              {successMessage}
            </motion.div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"
            >
              <Icon icon="solar:danger-circle-bold" className="text-lg shrink-0" />
              {errorMessage}
            </motion.div>
          )}

          {/* Login Form */}
          {tab === 'login' ? (
            <form onSubmit={loginForm.handleSubmit} className="space-y-4">
              <Input
                label="Email atau No. HP/WhatsApp"
                name="emailOrPhone"
                type="text"
                value={loginForm.values.emailOrPhone}
                onChange={loginForm.handleChange}
                placeholder="email@example.com atau 08123456789"
                required
              />

              {/* FIX: Password dengan fitur Mata */}
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginForm.values.password}
                  onChange={loginForm.handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 bottom-2.5 p-1 text-neutral-light hover:text-dark transition-colors"
                >
                  <Icon 
                    icon={showLoginPassword ? "solar:eye-linear" : "solar:eye-closed-linear"} 
                    className="text-xl" 
                  />
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-6"
                disabled={loginForm.isSubmitting}
              >
                {loginForm.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon icon="svg-spinners:ring-resize" className="text-xl" />
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
              <Input
                label="Nama Lengkap"
                name="name"
                type="text"
                value={registerForm.values.name}
                onChange={registerForm.handleChange}
                placeholder="Nama Lengkap"
                required
              />

              <Input
                label="Nomor HP/WhatsApp"
                name="phone"
                type="tel"
                value={registerForm.values.phone}
                onChange={registerForm.handleChange}
                placeholder="08123456789"
                required
              />

              <Textarea
                label="Alamat Lengkap"
                name="alamat"
                value={registerForm.values.alamat}
                onChange={registerForm.handleChange}
                placeholder="Contoh: Jl. Sudirman No. 12, Kec. Balaraja..."
                rows={3}
                required
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={registerForm.values.email}
                onChange={registerForm.handleChange}
                placeholder="email@example.com"
                required
              />

              {/* FIX: Password Register dengan fitur Mata */}
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerForm.values.password}
                  onChange={registerForm.handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 bottom-2.5 p-1 text-neutral-light hover:text-dark transition-colors"
                >
                  <Icon 
                    icon={showRegisterPassword ? "solar:eye-linear" : "solar:eye-closed-linear"} 
                    className="text-xl" 
                  />
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-6"
                disabled={registerForm.isSubmitting}
              >
                {registerForm.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon icon="svg-spinners:ring-resize" className="text-xl" />
                    Registering...
                  </span>
                ) : (
                  'Register'
                )}
              </Button>
            </form>
          )}

          {/* Footer Note */}
          <div className="mt-6 text-center border-t border-border pt-6">
            <p className="text-sm text-neutral-text">
              {tab === 'login' ? (
                <>
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
                    className="text-dark font-medium hover:underline transition-all"
                  >
                    Daftar sekarang
                  </button>
                </>
              ) : (
                <>
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
                    className="text-dark font-medium hover:underline transition-all"
                  >
                    Login di sini
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