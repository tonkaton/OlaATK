import axios from 'axios'
import { API_BASE_URL, APP_CONFIG } from '../config/constants'

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
    const token = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN)
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
      localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.USER_DATA)
      // window.location.href = '/login' // Opsional, biarkan komponen handle redirect
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
  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Services API (Data Layanan)
export const servicesAPI = {
  getAll: async (page = 1, search = '') => {
    const params = { page, limit: 10 }
    if (search) params.search = search
    const response = await api.get('/data-layanan', { params })
    return response.data.data || response.data
  },
  // [WAJIB ADA] Buat Dropdown Kasir
  getActive: async () => {
    const response = await api.get('/data-layanan/active')
    return response.data.data || response.data.dataLayanan || response.data
  },
  getById: async (id) => {
    const response = await api.get(`/data-layanan/${id}`)
    return response.data.dataLayanan || response.data
  },
  create: async (data) => {
    const response = await api.post('/data-layanan', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/data-layanan/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/data-layanan/${id}`)
    return response.data
  },
}

// Orders API (Pesanan) - UPGRADED: getTodayCount support mode
export const ordersAPI = {
  getAll: async (page = 1, search = '', status = '') => {
    const params = { page, limit: 10 }
    if (search) params.search = search
    if (status) params.status = status
    const response = await api.get('/pesanan', { params })
    return response.data.data || response.data
  },
  getById: async (id) => {
    const response = await api.get(`/pesanan/${id}`)
    return response.data.pesanan
  },
  // [WAJIB ADA] Buat Kasir Offline (Tanpa Auth User)
  createPublic: async (data) => {
    const response = await api.post('/pesanan/public', data)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/pesanan', data)
    return response.data.pesanan
  },
  update: async (id, data) => {
    const response = await api.put(`/pesanan/${id}`, data)
    return response.data.pesanan
  },
  // [WAJIB ADA] Buat Ganti Status (Menunggu -> Diproses)
  updateStatus: async (id, status) => {
    const response = await api.put(`/pesanan/${id}/status`, { status })
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/pesanan/${id}`)
    return response.data
  },
  // UPGRADE: Support filter mode (ONLINE / OFFLINE / undefined = semua)
  getTodayCount: async (mode = null) => {
    const params = mode ? { mode } : {}
    const response = await api.get('/pesanan/stats/today', { params })
    return response.data
  },
}

// Products API (Stok Barang)
export const productsAPI = {
  getAll: async (page = 1, search = '') => {
    const params = { page, limit: 10 }
    if (search) params.search = search
    const response = await api.get('/stok-barang', { params })
    return response.data.data || response.data
  },
  getById: async (id) => {
    const response = await api.get(`/stok-barang/${id}`)
    return response.data.stokBarang
  },
  create: async (data) => {
    const response = await api.post('/stok-barang', data)
    return response.data.stokBarang
  },
  update: async (id, data) => {
    const response = await api.put(`/stok-barang/${id}`, data)
    return response.data.stokBarang
  },
  delete: async (id) => {
    const response = await api.delete(`/stok-barang/${id}`)
    return response.data
  },
}

// Users API (Pelanggan)
export const usersAPI = {
  getAll: async (page = 1, search = '') => {
    const params = { page, limit: 10 }
    if (search) params.search = search
    const response = await api.get('/pelanggan', { params })
    return response.data.data || response.data
  },
  getById: async (id) => {
    const response = await api.get(`/pelanggan/${id}`)
    return response.data.pelanggan
  },
  create: async (data) => {
    const response = await api.post('/pelanggan', data)
    return response.data.pelanggan
  },
  update: async (id, data) => {
    const response = await api.put(`/pelanggan/${id}`, data)
    return response.data.pelanggan
  },
  delete: async (id) => {
    const response = await api.delete(`/pelanggan/${id}`)
    return response.data
  },
}

// Accounts API (Akun Pelanggan)
export const accountsAPI = {
  getAll: async (page = 1, search = '') => {
    const params = { page, limit: 10 }
    if (search) params.search = search
    const response = await api.get('/akun-pelanggan', { params })
    return response.data.data || response.data
  },
  getById: async (id) => {
    const response = await api.get(`/akun-pelanggan/${id}`)
    return response.data.akunPelanggan
  },
  create: async (data) => {
    const response = await api.post('/akun-pelanggan', data)
    return response.data.akunPelanggan
  },
  update: async (id, data) => {
    const response = await api.put(`/akun-pelanggan/${id}`, data)
    return response.data.akunPelanggan
  },
  delete: async (id) => {
    const response = await api.delete(`/akun-pelanggan/${id}`)
    return response.data
  },
}

// Stats API
export const statsAPI = {
  getDashboard: async () => {
    const response = await api.get('/stats/dashboard')
    return response.data.data || response.data
  },
}

// Configuration API
export const configAPI = {
  getAll: async () => {
    const response = await api.get('/konfigurasi')
    return response.data.data || response.data
  },
  batchUpdate: async (configs) => {
    const response = await api.put('/konfigurasi/batch', { configs })
    return response.data
  },
}

// [FIXED] UPLOAD API (BACK TO BASE64)
export const uploadAPI = {
  uploadFile: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const payload = {
            fileName: file.name,
            fileData: reader.result,
            mimeType: file.type
          }
          const response = await api.post('/upload/file', payload)
          resolve(response.data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsDataURL(file)
    })
  },
}

export default api