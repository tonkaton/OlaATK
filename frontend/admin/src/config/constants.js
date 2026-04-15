export const API_BASE_URL = import.meta.env.VITE_API_URL

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  
  // Products
  PRODUCTS: '/stok-barang',
  PRODUCT_BY_ID: (id) => `/stok-barang/${id}`,
  
  // Orders
  ORDERS: '/pesanan',
  ORDER_BY_ID: (id) => `/pesanan/${id}`,
  
  // Users/Pelanggan
  USERS: '/pelanggan',
  USER_BY_ID: (id) => `/pelanggan/${id}`,
  
  // Services
  SERVICES: '/data-layanan',
  SERVICE_BY_ID: (id) => `/data-layanan/${id}`,
  
  // Accounts
  ACCOUNTS: '/akun-pelanggan',
  ACCOUNT_BY_ID: (id) => `/akun-pelanggan/${id}`,
}

// App Configuration
export const APP_CONFIG = {
  ITEMS_PER_PAGE: 10,
  LOCAL_STORAGE_KEYS: {
    // [PENTING] Key ini DIBEDAKAN dari User biar gak bentrok session (Flickering)
    AUTH_TOKEN: 'olaatk_admin_token', 
    USER_DATA: 'olaatk_admin_data',
  },
}

// Order Status
export const ORDER_STATUS = {
  PENDING: 'Menunggu',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
}

// Order Status Colors
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-slate-200 text-slate-800',
  [ORDER_STATUS.PROCESSING]: 'bg-yellow-200 text-yellow-800',
  [ORDER_STATUS.COMPLETED]: 'bg-green-200 text-green-800',
}