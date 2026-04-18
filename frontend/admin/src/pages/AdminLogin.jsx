import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Lock, User, Zap, Eye, EyeOff } from 'lucide-react'
import useForm from '../hooks/useForm'
import { authAPI } from '../services/api'
import { APP_CONFIG } from '../config/constants'
import { cn } from '@/lib/utils'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { values, errors, handleChange, handleSubmit } = useForm(
    { username: '', password: '' },
    async (formValues) => {
      setError('')
      setLoading(true)
      try {
        const response = await authAPI.login({
          username: formValues.username,
          password: formValues.password
        })
        if (response.success && response.data?.token && response.data.userType === 'admin') {
          localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN, response.data.token)
          localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify({ 
            userType: response.data.userType,
            userId: response.data.userId 
          }))
          navigate('/')
        } else {
          setError('Username atau password salah.')
        }
      } catch (err) {
        setError(err.response?.status === 401 ? 'Username atau password salah.' : 'Login gagal. Coba lagi.')
      } finally {
        setLoading(false)
      }
    }
  )

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-olaTosca/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-olaTosca/15 border border-olaTosca/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-olaTosca" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">{APP_CONFIG.APP_NAME}</div>
              <div className="text-xs text-muted-foreground">Admin Panel</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Selamat datang</h1>
          <p className="text-sm text-muted-foreground mb-6">Masuk ke OLA ATK Dashboard</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="username"
                  type="text"
                  value={values.username}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 focus:border-olaTosca/60 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 focus:border-olaTosca/60 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-olaTosca hover:bg-olaTosca/90 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Masuk...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_CONFIG.APP_NAME}
        </p>
      </motion.div>
    </div>
  )
}