// COMPLETE EXAMPLE: Refactored Produk Page with Full API Integration
// This is an example of how your final Produk.jsx should look when fully integrated with the backend API

import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import GlassTable from '../components/GlassTable'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import usePagination from '../hooks/usePagination'
import { productsAPI } from '../services/api'

export default function ProdukWithAPI({ dark }) {
  // State management
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({ name: '', stock: '', price: '' })
  const [submitting, setSubmitting] = useState(false)

  // Filter products based on search
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  
  // Pagination
  const { page, setPage, maxPage, currentData } = usePagination(filtered)

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Fetch all products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await productsAPI.getAll()
      setProducts(data)
    } catch (err) {
      setError('Failed to load products. Please try again.')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Open modal for adding new product
  const openAdd = () => {
    setFormData({ name: '', stock: '', price: '' })
    setEditId(null)
    setModalOpen(true)
  }

  // Open modal for editing existing product
  const openEdit = (product) => {
    setFormData({ 
      name: product.name, 
      stock: product.stock, 
      price: product.price 
    })
    setEditId(product.id)
    setModalOpen(true)
  }

  // Save product (create or update)
  const saveProduct = async () => {
    // Basic validation
    if (!formData.name || !formData.stock || !formData.price) {
      alert('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      if (editId !== null) {
        // Update existing product
        await productsAPI.update(editId, formData)
        console.log('Product updated successfully')
      } else {
        // Create new product
        await productsAPI.create(formData)
        console.log('Product created successfully')
      }
      
      // Close modal and refresh list
      setModalOpen(false)
      await fetchProducts()
      
      // Optional: Show success message
      // You can add a toast notification here
    } catch (err) {
      console.error('Error saving product:', err)
      alert('Failed to save product. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete product
  const delProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await productsAPI.delete(id)
      console.log('Product deleted successfully')
      await fetchProducts()
      
      // Optional: Show success message
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Failed to delete product. Please try again.')
    }
  }

  // Render loading state
  if (loading) {
    return (
      <Section dark={dark} title="Manajemen Produk">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olaTosca"></div>
        </div>
      </Section>
    )
  }

  // Render error state
  if (error) {
    return (
      <Section dark={dark} title="Manajemen Produk">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchProducts} 
            className="px-4 py-2 bg-olabutton text-white rounded"
          >
            Retry
          </button>
        </div>
      </Section>
    )
  }

  // Render main content
  return (
    <Section dark={dark} title="Manajemen Produk" search={search} setSearch={setSearch}>
      <button 
        onClick={openAdd} 
        className="px-3 py-1 rounded bg-olabutton text-white mb-3 hover:opacity-90 transition"
      >
        + Tambah Produk
      </button>
      
      {/* Empty state */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No products found. Click "Tambah Produk" to add your first product.</p>
        </div>
      ) : (
        <>
          {/* Products table */}
          <GlassTable headers={["Nama", "Stok", "Harga", "Aksi"]} dark={dark}>
            {currentData.map(p => (
              <tr key={p.id} className={dark ? 'border-b border-white/5' : 'border-b border-gray-100'}>
                <td className="py-3">{p.name}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    p.stock < 10 ? 'bg-red-100 text-red-800' : 
                    p.stock < 50 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {p.stock}
                  </span>
                </td>
                <td className="py-3">{p.price}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEdit(p)} 
                      className="text-sm px-2 py-1 rounded border border-white/20 hover:bg-white/10 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => delProduct(p.id)} 
                      className="text-sm px-2 py-1 rounded border border-red-400 text-red-400 hover:bg-red-400/10 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </GlassTable>
          
          {/* Pagination */}
          <Pagination page={page} setPage={setPage} maxPage={maxPage} />
        </>
      )}

      {/* Modal for add/edit */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => !submitting && setModalOpen(false)} 
        title={editId !== null ? 'Edit Produk' : 'Tambah Produk'} 
        dark={dark}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Produk</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} 
              placeholder="Contoh: Kertas A4" 
              className="w-full p-2 rounded border border-black/20 focus:border-olaTosca focus:outline-none"
              disabled={submitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Stok</label>
            <input 
              value={formData.stock} 
              onChange={e => setFormData(f => ({ ...f, stock: e.target.value }))} 
              placeholder="100" 
              type="number" 
              min="0"
              className="w-full p-2 rounded border border-black/20 focus:border-olaTosca focus:outline-none"
              disabled={submitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Harga</label>
            <input 
              value={formData.price} 
              onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} 
              placeholder="Rp50.000" 
              className="w-full p-2 rounded border border-black/20 focus:border-olaTosca focus:outline-none"
              disabled={submitting}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button 
              onClick={() => setModalOpen(false)} 
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 transition"
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              onClick={saveProduct} 
              className="px-4 py-2 rounded bg-olabutton text-white hover:opacity-90 transition disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </Section>
  )
}

// ================================================================================
// NOTES FOR IMPLEMENTATION:
// ================================================================================
/*

1. LOADING STATES:
   - Show spinner while fetching data
   - Disable buttons during submission
   - Show "Menyimpan..." text when saving

2. ERROR HANDLING:
   - Catch all API errors
   - Show user-friendly error messages
   - Provide retry mechanism

3. VALIDATION:
   - Check required fields before submit
   - Validate data types (numbers, strings)
   - Show validation errors to user

4. USER FEEDBACK:
   - Confirm before delete
   - Show success/error messages (consider adding toast notifications)
   - Update UI immediately after actions

5. EMPTY STATES:
   - Show helpful message when no data
   - Guide user to add first item

6. ACCESSIBILITY:
   - Use semantic HTML
   - Add labels to form inputs
   - Disable buttons appropriately

7. PERFORMANCE:
   - Only re-fetch when needed
   - Use pagination for large datasets
   - Debounce search if needed

8. FUTURE ENHANCEMENTS:
   - Add toast notifications library (react-hot-toast, react-toastify)
   - Add form validation library (yup, zod)
   - Add optimistic updates
   - Add caching strategy
   - Add infinite scroll option

*/
