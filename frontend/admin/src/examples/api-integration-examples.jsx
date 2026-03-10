// This file shows examples of how to integrate the API layer with your components
// Replace dummy data in your actual page files with these patterns

import { useState, useEffect } from 'react'
import { productsAPI, ordersAPI, servicesAPI, usersAPI } from '../services/api'

// ============================================
// EXAMPLE 1: Fetching Data with Loading State
// ============================================
export function ProductListExample() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await productsAPI.getAll()
        setProducts(data)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}

// ============================================
// EXAMPLE 2: Creating New Data
// ============================================
export function CreateProductExample() {
  const [formData, setFormData] = useState({ name: '', stock: 0, price: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const newProduct = await productsAPI.create(formData)
      console.log('Product created:', newProduct)
      // Reset form or redirect
      setFormData({ name: '', stock: 0, price: '' })
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.name} 
        onChange={e => setFormData({...formData, name: e.target.value})}
        placeholder="Product name"
      />
      {/* More inputs... */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  )
}

// ============================================
// EXAMPLE 3: Updating Data
// ============================================
export function UpdateProductExample({ productId }) {
  const [formData, setFormData] = useState({ name: '', stock: 0, price: '' })
  const [loading, setLoading] = useState(false)

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await productsAPI.getById(productId)
        setFormData({
          name: product.name,
          stock: product.stock,
          price: product.price
        })
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    }
    
    if (productId) fetchProduct()
  }, [productId])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await productsAPI.update(productId, formData)
      console.log('Product updated')
      // Show success message or redirect
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpdate}>
      {/* Form inputs */}
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Product'}
      </button>
    </form>
  )
}

// ============================================
// EXAMPLE 4: Deleting Data
// ============================================
export function DeleteProductExample({ productId, onDeleted }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    setLoading(true)
    try {
      await productsAPI.delete(productId)
      console.log('Product deleted')
      onDeleted?.() // Callback to refresh list
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}

// ============================================
// EXAMPLE 5: Complete CRUD Component
// ============================================
export function ProductManagementExample() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', stock: 0, price: '' })

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await productsAPI.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Create or Update
  const handleSave = async () => {
    try {
      if (editingId) {
        await productsAPI.update(editingId, formData)
      } else {
        await productsAPI.create(formData)
      }
      setFormData({ name: '', stock: 0, price: '' })
      setEditingId(null)
      fetchProducts() // Refresh list
    } catch (error) {
      console.error('Error saving:', error)
    }
  }

  // Delete
  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await productsAPI.delete(id)
      fetchProducts() // Refresh list
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  // Edit
  const handleEdit = (product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      stock: product.stock,
      price: product.price
    })
  }

  return (
    <div>
      {/* Form */}
      <div>
        <input 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
        <button onClick={handleSave}>
          {editingId ? 'Update' : 'Create'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {products.map(product => (
            <div key={product.id}>
              <span>{product.name}</span>
              <button onClick={() => handleEdit(product)}>Edit</button>
              <button onClick={() => handleDelete(product.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// EXAMPLE 6: Using with Search/Filter
// ============================================
export function ProductSearchExample() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Pass search as query parameter
        const data = await productsAPI.getAll({ search })
        setProducts(data)
      } catch (error) {
        console.error('Error:', error)
      }
    }
    
    // Debounce search
    const timeoutId = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  return (
    <div>
      <input 
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search products..."
      />
      {products.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  )
}

// ============================================
// EXAMPLE 7: Order Creation with File Upload
// ============================================
export function CreateOrderExample() {
  const [formData, setFormData] = useState({
    name: '',
    service: 'Cetak Dokumen',
    note: ''
  })
  const [file, setFile] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // If you need to upload file, use FormData
      const data = new FormData()
      data.append('name', formData.name)
      data.append('service', formData.service)
      data.append('note', formData.note)
      if (file) data.append('file', file)

      // Note: You might need to adjust the API to handle FormData
      await ordersAPI.create(formData)
      alert('Order created successfully!')
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        name="name"
        value={formData.name}
        onChange={e => setFormData({...formData, name: e.target.value})}
      />
      <input 
        type="file"
        onChange={e => setFile(e.target.files[0])}
      />
      <button type="submit">Submit Order</button>
    </form>
  )
}
