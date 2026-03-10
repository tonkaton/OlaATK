// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/akun-pelanggan',
  
  // Services
  SERVICES: '/data-layanan',
  SERVICE_BY_ID: (id) => `/data-layanan/${id}`,
  
  // Orders
  ORDERS: '/pesanan',
  ORDER_BY_ID: (id) => `/pesanan/${id}`,
  CREATE_ORDER: '/pesanan',
  
  // Products
  PRODUCTS: '/stok-barang',
  PRODUCT_BY_ID: (id) => `/stok-barang/${id}`,
}

// Local Storage Keys
// NOTE: APP_NAME, APP_TAGLINE, and CONTACT_INFO are now fetched dynamically
// from the backend via ConfigContext. Use useConfig() hook to access them.
export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'ola_auth_token',
  USER_DATA: 'ola_user_data',
}
