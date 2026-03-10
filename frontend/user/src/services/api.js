import axios from 'axios'
import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../config/constants'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      // Handle unauthorized access (Token expired/invalid)
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA)
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },
  registerPelanggan: async (userData) => {
    const response = await api.post('/pelanggan', userData)
    return response.data
  },
  registerAkun: async (akunData) => {
    const response = await api.post('/akun-pelanggan', akunData)
    return response.data
  },
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  getPelangganByUserId: async (userId) => {
    const response = await api.get(`/pelanggan/${userId}`)
    return response.data
  },
}

// Services API
export const servicesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/data-layanan', { params })
    return response.data
  },
  getActive: async () => {
    const response = await api.get('/data-layanan/active')
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/data-layanan/${id}`)
    return response.data
  },
}

// Orders API
export const ordersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/pesanan', { params })
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/pesanan/${id}`)
    return response.data
  },
  create: async (orderData) => {
    const response = await api.post('/pesanan', orderData)
    return response.data
  },
  createPublic: async (orderData) => {
    const response = await api.post('/pesanan/public', orderData)
    return response.data
  },
  update: async (id, orderData) => {
    const response = await api.put(`/pesanan/${id}`, orderData)
    return response.data
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/pesanan/${id}/status`, { status })
    return response.data
  },
  // [FIX] Update fungsi ini biar bisa terima parameter 'mode'
  getTodayCount: async (mode) => {
    // Kalau ada mode (misal 'ONLINE'), kirim sebagai query params
    const params = mode ? { mode } : {}
    const response = await api.get('/pesanan/stats/today', { params })
    return response.data
  },
}

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/stok-barang', { params })
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/stok-barang/${id}`)
    return response.data
  },
}

// [FIXED] UPLOAD API (GANTI KE BASE64 / FileReader)
export const uploadAPI = {
  uploadFile: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      // 1. Baca file jadi text panjang (Base64)
      reader.onloadend = async () => {
        try {
          // Bikin payload JSON
          const payload = {
            fileName: file.name,
            fileData: reader.result, // Data Base64
            mimeType: file.type
          }
          
          // 2. Kirim ke Backend sebagai JSON (bukan FormData)
          const response = await api.post('/upload/file', payload)
          resolve(response.data)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      
      // Mulai proses baca
      reader.readAsDataURL(file)
    })
  },
}

// Configuration API
export const configAPI = {
  getPublic: async () => {
    const response = await api.get('/konfigurasi/public')
    return response.data.data
  },
}

export default api