# API Integration Quick Reference

## How to Use the API Services

### Importing API Services

```javascript
import { authAPI, productsAPI, ordersAPI, usersAPI, servicesAPI } from '../services/api'
```

## Authentication API

### Login (Admin)
```javascript
const response = await authAPI.login({
  username: 'admin',
  password: 'password123'
})
// Returns: { token, userType: 'admin' }
```

### Login (User)
```javascript
const response = await authAPI.login({
  email: 'user@example.com',
  password: 'password123'
})
// Returns: { token, userType: 'user', userId }
```

### Logout
```javascript
await authAPI.logout()
```

### Get Current User
```javascript
const user = await authAPI.me()
// Returns: { isAuthenticated, userType, userId? }
```

## Products API (Stok Barang)

### Get All Products
```javascript
const products = await productsAPI.getAll()
// Returns: Array of { id, nama, harga_satuan, jumlah_stok }
```

### Get Product by ID
```javascript
const product = await productsAPI.getById(1)
// Returns: { id, nama, harga_satuan, jumlah_stok }
```

### Create Product
```javascript
const newProduct = await productsAPI.create({
  nama: 'Kertas A4',
  harga_satuan: 45000,
  jumlah_stok: 100
})
```

### Update Product
```javascript
const updated = await productsAPI.update(1, {
  nama: 'Kertas A4 80gsm',
  harga_satuan: 50000,
  jumlah_stok: 150
})
```

### Delete Product
```javascript
await productsAPI.delete(1)
```

## Orders API (Pesanan)

### Get All Orders
```javascript
const orders = await ordersAPI.getAll()
// Returns: Array with related pelanggan and barangTerbeli data
```

### Get Order by ID
```javascript
const order = await ordersAPI.getById(1)
```

### Create Order
```javascript
const newOrder = await ordersAPI.create({
  id_pelanggan: 1,
  jenis_layanan: 'Cetak Dokumen',
  nama_file: 'proposal.pdf',  // optional
  catatan_pesanan: 'Warna',    // optional
  nilai_pesanan: 50000
})
```

### Update Order
```javascript
const updated = await ordersAPI.update(1, {
  jenis_layanan: 'Cetak & Jilid',
  nilai_pesanan: 75000
  // Note: id_pelanggan cannot be updated
})
```

### Delete Order
```javascript
await ordersAPI.delete(1)
```

## Users API (Pelanggan)

### Get All Users
```javascript
const users = await usersAPI.getAll()
// Returns: Array with related akunPelanggan and pesanan data
```

### Get User by ID
```javascript
const user = await usersAPI.getById(1)
```

### Create User
```javascript
const newUser = await usersAPI.create({
  nama_lengkap: 'Budi Santoso',
  nomor_telepon: '081234567890'
})
```

### Update User
```javascript
const updated = await usersAPI.update(1, {
  nama_lengkap: 'Budi Santoso S.Kom',
  nomor_telepon: '081234567891'
})
```

### Delete User
```javascript
await usersAPI.delete(1)
```

## Services API (Data Layanan)

### Get All Services
```javascript
const services = await servicesAPI.getAll()
```

### Get Service by ID
```javascript
const service = await servicesAPI.getById(1)
```

### Create Service
```javascript
const newService = await servicesAPI.create({
  nama: 'Cetak Dokumen',
  deskripsi: 'Layanan cetak dokumen hitam putih dan berwarna',
  nama_icon: 'printer',
  status_layanan: true  // true = aktif, false = nonaktif
})
```

### Update Service
```javascript
const updated = await servicesAPI.update(1, {
  nama: 'Cetak Dokumen A4',
  deskripsi: 'Layanan cetak dokumen berbagai jenis kertas',
  nama_icon: 'printer',
  status_layanan: true
})
```

### Delete Service
```javascript
await servicesAPI.delete(1)
```

## Error Handling

All API calls should be wrapped in try-catch:

```javascript
try {
  const products = await productsAPI.getAll()
  setProducts(products)
  setError('')
} catch (err) {
  setError(err.message || 'Failed to fetch products')
  console.error('Error:', err)
}
```

## Complete Component Example

```javascript
import React, { useState, useEffect } from 'react'
import { productsAPI } from '../services/api'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await productsAPI.getAll()
      setProducts(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    
    try {
      await productsAPI.delete(id)
      fetchProducts() // Refresh list
    } catch (err) {
      setError(err.message || 'Failed to delete product')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.nama}</h3>
          <p>Price: Rp{product.harga_satuan}</p>
          <p>Stock: {product.jumlah_stok}</p>
          <button onClick={() => handleDelete(product.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

## Utility Functions

### Format Currency (Rupiah)
```javascript
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number)
}

// Usage: formatRupiah(50000) => "Rp50.000"
```

### Parse Number Input
```javascript
// For integer fields (stock)
const stock = parseInt(formData.jumlah_stok)

// For decimal fields (price)
const price = parseFloat(formData.harga_satuan)
```

## Response Interceptor Behavior

The API service automatically:
1. Extracts `data` from successful responses: `{ success: true, data: {...} }` → returns `data`
2. Redirects to `/login` on 401 Unauthorized responses
3. Throws Error with backend message on failures
4. Removes auth tokens on logout/unauthorized

## Request Interceptor Behavior

The API service automatically:
1. Adds `Authorization: Bearer <token>` header to all requests
2. Reads token from `localStorage.getItem('ola_auth_token')`
3. Sets `Content-Type: application/json` header

## Local Storage Keys

```javascript
// From APP_CONFIG.LOCAL_STORAGE_KEYS
'ola_auth_token'  // JWT token
'ola_is_admin'    // '1' if admin, removed if not
'ola_user_data'   // User data (optional)
```

## Backend Base URL

Default: `http://localhost:8080`

Override with environment variable:
```bash
VITE_API_URL=http://localhost:8080
```
