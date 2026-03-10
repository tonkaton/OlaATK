import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import GlassTable from '../components/GlassTable'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { productsAPI } from '../services/api'

export default function Produk({ dark }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({ nama: '', jumlah_stok: '', harga_satuan: '' })
  const [saving, setSaving] = useState(false)

  // Fetch products when page or search changes
  useEffect(() => {
    fetchProducts()
  }, [page, search])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await productsAPI.getAll(page, search)
      setProducts(response.stokBarang || [])
      setPagination(response.pagination || { total: 0, totalPages: 0, limit: 10 })
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to fetch products')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setFormData({ nama: '', jumlah_stok: '', harga_satuan: '' })
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setFormData({ 
      nama: p.nama, 
      jumlah_stok: p.jumlah_stok, 
      harga_satuan: p.harga_satuan 
    })
    setEditId(p.id)
    setModalOpen(true)
  }

  const saveProduct = async () => {
    // Validate form
    if (!formData.nama || !formData.jumlah_stok || !formData.harga_satuan) {
      setError('Semua field harus diisi')
      return
    }

    try {
      setSaving(true)
      const productData = {
        nama: formData.nama,
        jumlah_stok: parseInt(formData.jumlah_stok),
        harga_satuan: parseFloat(formData.harga_satuan)
      }

      if (editId !== null) {
        // Update existing product
        await productsAPI.update(editId, productData)
      } else {
        // Create new product
        await productsAPI.create(productData)
      }
      
      setModalOpen(false)
      fetchProducts() // Refresh the list
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to save product')
      console.error('Error saving product:', err)
    } finally {
      setSaving(false)
    }
  }

  const delProduct = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return
    }

    try {
      await productsAPI.delete(id)
      fetchProducts() // Refresh the list
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to delete product')
      console.error('Error deleting product:', err)
    }
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  return (
    <>
      <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-olabutton text-white mb-4 hover:opacity-90 transition">
        + Tambah Produk
      </button>
      
      <Section dark={dark} title="Manajemen Produk" search={search} setSearch={setSearch}>
        {error && (
          <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Tidak ada data produk. Klik tombol "Tambah Produk" untuk menambah data.
          </div>
        ) : (
          <>
          <GlassTable 
            headers={["Nama", "Stok", "Harga", "Aksi"]} 
            columnWidths={["250px", "60px", "60px", "150px"]}
            dark={dark}
          >
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.nama}</td>
                <td>{p.jumlah_stok}</td>
                <td>{formatRupiah(p.harga_satuan)}</td>
                <td className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-sm px-2 py-1 rounded border border-white/20">
                    Edit
                  </button>
                  <button onClick={() => delProduct(p.id)} className="text-sm px-2 py-1 rounded border border-red-400 text-red-400">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </GlassTable>
          
          <Pagination page={page} setPage={setPage} maxPage={pagination.totalPages} />
        </>
      )}
    </Section>

    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId !== null ? 'Edit Produk' : 'Tambah Produk'} dark={dark}>
      <input
        value={formData.nama}
        onChange={e => setFormData(f => ({ ...f, nama: e.target.value }))}
        placeholder="Nama Produk"
          className={`w-full mb-3 p-2 rounded border border-black/90 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'}`}
          disabled={saving}
        />
        <input 
          value={formData.jumlah_stok} 
          onChange={e => setFormData(f => ({ ...f, jumlah_stok: e.target.value }))} 
          placeholder="Jumlah Stok" 
          type="number" 
          className={`w-full mb-3 p-2 rounded border border-black/90 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'}`}
          disabled={saving}
        />
        <input 
          value={formData.harga_satuan} 
          onChange={e => setFormData(f => ({ ...f, harga_satuan: e.target.value }))} 
          placeholder="Harga Satuan (Rp)" 
          type="number"
          step="0.01"
          className={`w-full mb-3 p-2 rounded border border-black/90 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'}`}
          disabled={saving}
        />
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => setModalOpen(false)} 
            className="px-3 py-1 rounded border"
            disabled={saving}
          >
            Batal
          </button>
          <button 
            onClick={saveProduct} 
            className="px-3 py-1 rounded bg-olabutton text-white disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </Modal>
    </>
  )
}
