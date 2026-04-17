import React, { useState, useEffect } from 'react'
import { productsAPI } from '../services/api'
import { Plus, Pencil, Trash2, Package, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  useEffect(() => { fetchProducts() }, [page, search])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await productsAPI.getAll(page, search)
      setProducts(response.stokBarang || [])
      setPagination(response.pagination || { total: 0, totalPages: 0, limit: 10 })
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal memuat produk')
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
    setFormData({ nama: p.nama, jumlah_stok: p.jumlah_stok, harga_satuan: p.harga_satuan })
    setEditId(p.id)
    setModalOpen(true)
  }

  const saveProduct = async () => {
    if (!formData.nama || !formData.jumlah_stok || !formData.harga_satuan) {
      setError('Semua field harus diisi')
      return
    }
    try {
      setSaving(true)
      const data = {
        nama: formData.nama,
        jumlah_stok: parseInt(formData.jumlah_stok),
        harga_satuan: parseFloat(formData.harga_satuan)
      }
      if (editId !== null) await productsAPI.update(editId, data)
      else await productsAPI.create(data)
      setModalOpen(false)
      fetchProducts()
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const delProduct = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return
    try {
      await productsAPI.delete(id)
      fetchProducts()
    } catch (err) {
      setError(err.message || 'Gagal menghapus')
    }
  }

  const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 focus:border-olaTosca/60 transition disabled:opacity-50"

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Produk & Stok</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{pagination.total} produk terdaftar</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-3 py-2 bg-olaTosca hover:bg-olaTosca/90 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Tambah Produk
        </button>
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari produk..."
            className={inputClass}
          />
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">{error}</div>
        )}

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">Belum ada produk</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stok</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Harga</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className={cn('border-b border-border last:border-0 hover:bg-muted/20 transition', i % 2 === 0 ? '' : 'bg-muted/10')}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.nama}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border',
                      p.jumlah_stok > 10 ? 'bg-olaTosca/10 text-olaTosca border-olaTosca/20' :
                      p.jumlah_stok > 0 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                      'bg-destructive/10 text-destructive border-destructive/20'
                    )}>
                      {p.jumlah_stok} unit
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{formatRupiah(p.harga_satuan)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => delProduct(p.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                {editId !== null ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Nama Produk</label>
                <input value={formData.nama} onChange={e => setFormData(f => ({ ...f, nama: e.target.value }))} placeholder="Contoh: Kertas HVS A4" className={inputClass} disabled={saving} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Jumlah Stok</label>
                <input value={formData.jumlah_stok} onChange={e => setFormData(f => ({ ...f, jumlah_stok: e.target.value }))} placeholder="0" type="number" className={inputClass} disabled={saving} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Harga Satuan (Rp)</label>
                <input value={formData.harga_satuan} onChange={e => setFormData(f => ({ ...f, harga_satuan: e.target.value }))} placeholder="0" type="number" className={inputClass} disabled={saving} />
              </div>
            </div>

            {error && (
              <div className="mt-3 p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs">{error}</div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent text-foreground transition disabled:opacity-50">
                Batal
              </button>
              <button onClick={saveProduct} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-olaTosca hover:bg-olaTosca/90 text-white font-medium transition disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}