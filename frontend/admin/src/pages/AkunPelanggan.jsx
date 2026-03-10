import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { accountsAPI, usersAPI } from '../services/api'

export default function AkunPelanggan({ dark }) {
  const [search, setSearch] = useState("")
  const [accounts, setAccounts] = useState([])
  const [pelangganList, setPelangganList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({ 
    id_pelanggan: '', 
    nama_lengkap: '',
    alamat: '',
    email: '', 
    nomor_telepon: '', 
    password: '' 
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAccounts()
    fetchPelanggan()
  }, [page, search])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsAPI.getAll(page, search)
      setAccounts(response.akunPelanggan || [])
      setPagination(response.pagination || { total: 0, totalPages: 0, limit: 10 })
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to fetch accounts')
      console.error('Error fetching accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPelanggan = async () => {
    try {
      const response = await usersAPI.getAll(1, '', 1000) // Get all users
      setPelangganList(response.pelanggan || [])
    } catch (err) {
      console.error('Error fetching pelanggan:', err)
    }
  }

  const openAdd = () => {
    setFormData({ 
      id_pelanggan: '', 
      nama_lengkap: '',
      alamat: '',
      email: '', 
      nomor_telepon: '', 
      password: '' 
    })
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (account) => {
    setFormData({
      id_pelanggan: account.id_pelanggan,
      nama_lengkap: account.pelanggan?.nama_lengkap || '',
      alamat: account.pelanggan?.alamat || '',
      email: account.email,
      nomor_telepon: account.nomor_telepon,
      password: '' // Don't show password
    })
    setEditId(account.id)
    setModalOpen(true)
  }

  const saveAccount = async () => {
    if (!formData.email || !formData.nomor_telepon) {
      setError('Email dan nomor telepon harus diisi')
      return
    }
    if (!formData.nama_lengkap) {
      setError('Nama lengkap harus diisi')
      return
    }
    if (editId === null && !formData.password?.trim()) {
      setError('Password harus diisi untuk akun baru')
      return
    }
    if (editId === null && !formData.id_pelanggan) {
      setError('Pelanggan harus dipilih')
      return
    }

    try {
      setSaving(true)
      const accountData = {}
      
      // Only add fields that have values
      const emailValue = formData.email?.trim()
      const phoneValue = formData.nomor_telepon?.trim()
      const alamatValue = formData.alamat?.trim()
      const passwordValue = formData.password?.trim()
      
      if (emailValue) {
        accountData.email = emailValue
      }
      
      if (phoneValue) {
        accountData.nomor_telepon = phoneValue
      }
      
      if (alamatValue) {
        accountData.alamat = alamatValue
      } else {
        accountData.alamat = null
      }
      
      if (passwordValue) {
        accountData.hashed_password = passwordValue
      }

      if (editId !== null) {
        // Update akun pelanggan
        await accountsAPI.update(editId, accountData)
        
        // Update pelanggan data (nama and alamat)
        const pelangganData = {}
        const namaValue = formData.nama_lengkap?.trim()
        
        if (namaValue) {
          pelangganData.nama_lengkap = namaValue
        }
        
        if (alamatValue) {
          pelangganData.alamat = alamatValue
        } else {
          pelangganData.alamat = null
        }
        
        await usersAPI.update(formData.id_pelanggan, pelangganData)
      } else {
        // Create - id_pelanggan and password are required
        accountData.id_pelanggan = parseInt(formData.id_pelanggan)
        if (!passwordValue) {
          setError('Password harus diisi untuk akun baru')
          setSaving(false)
          return
        }
        accountData.hashed_password = passwordValue
        await accountsAPI.create(accountData)
      }

      setModalOpen(false)
      fetchAccounts()
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to save account')
      console.error('Error saving account:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
      return
    }
    try {
      await accountsAPI.delete(id)
      fetchAccounts()
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to delete account')
      console.error('Error deleting account:', err)
    }
  }

  return (
    <>
      <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-olabutton text-white mb-4 hover:opacity-90 transition">
        + Tambah Akun
      </button>

      <Section dark={dark} title="Akun Pelanggan" search={search} setSearch={setSearch}>
        {error && (
          <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {accounts.map(acc => (
              <div key={acc.id} className="p-3 rounded-lg bg-white/6 mb-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium break-words">{acc.email}</div>
                    <div className="text-sm opacity-70">{acc.nomor_telepon}</div>
                    {acc.pelanggan && (
                      <>
                        <div className="text-sm opacity-70 mt-1 break-words">
                          👤 {acc.pelanggan.nama_lengkap}
                        </div>
                        {acc.pelanggan.alamat && (
                          <div className="text-sm opacity-60 mt-1 break-words">
                            📍 {acc.pelanggan.alamat}
                          </div>
                        )}
                      </>
                    )}
                    <div className="text-xs opacity-60 mt-1">
                      Dibuat: {new Date(acc.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 self-end sm:self-start">
                    <button 
                      onClick={() => openEdit(acc)} 
                      className="text-sm px-3 py-1.5 rounded border border-white/20 hover:bg-white/10 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)} 
                      className="text-sm px-3 py-1.5 rounded text-red-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <Pagination page={page} setPage={setPage} maxPage={pagination.totalPages} />
          </>
        )}
      </Section>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editId !== null ? 'Edit Akun' : 'Tambah Akun'} 
        dark={dark}
      >
        {editId === null && (
          <select
            value={formData.id_pelanggan}
            onChange={e => {
              const selectedId = e.target.value
              setFormData(f => ({ ...f, id_pelanggan: selectedId }))
              
              // Auto-fill nama and alamat from selected pelanggan
              if (selectedId) {
                const selectedPelanggan = pelangganList.find(p => p.id === parseInt(selectedId))
                if (selectedPelanggan) {
                  setFormData(f => ({ 
                    ...f, 
                    id_pelanggan: selectedId,
                    nama_lengkap: selectedPelanggan.nama_lengkap,
                    alamat: selectedPelanggan.alamat || ''
                  }))
                }
              }
            }}
            className={`w-full mb-3 p-2 rounded border border-black/20 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'}`}
            disabled={saving}
          >
            <option value="">Pilih Pelanggan</option>
            {pelangganList.map(p => (
              <option key={p.id} value={p.id}>
                {p.nama_lengkap} ({p.nomor_telepon})
              </option>
            ))}
          </select>
        )}
        
        <input 
          value={formData.nama_lengkap}
          onChange={e => setFormData(f => ({ ...f, nama_lengkap: e.target.value }))}
          placeholder="Nama Lengkap"
          type="text"
          className={`w-full mb-3 p-2 rounded border border-black/20 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'} ${editId === null ? 'bg-opacity-50' : ''}`}
          disabled={saving || editId === null}
          readOnly={editId === null}
          title={editId === null ? 'Nama diambil dari pelanggan yang dipilih' : ''}
        />
        
        <textarea 
          value={formData.alamat}
          onChange={e => setFormData(f => ({ ...f, alamat: e.target.value }))}
          placeholder="Alamat"
          rows={2}
          className={`w-full mb-3 p-2 rounded border border-black/20 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'} ${editId === null ? 'bg-opacity-50' : ''}`}
          disabled={saving || editId === null}
          readOnly={editId === null}
          title={editId === null ? 'Alamat diambil dari pelanggan yang dipilih' : ''}
        />
        
        <input 
          value={formData.email}
          onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
          placeholder="Email"
          type="email"
          className={`w-full mb-3 p-2 rounded border border-black/20 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'}`}
          disabled={saving}
        />
        
        <input 
          value={formData.nomor_telepon}
          onChange={e => setFormData(f => ({ ...f, nomor_telepon: e.target.value }))}
          placeholder="Nomor Telepon"
          type="tel"
          className={`w-full mb-3 p-2 rounded border border-black/20 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'}`}
          disabled={saving}
        />
        
        <input 
          value={formData.password}
          onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
          placeholder={editId !== null ? "Password (kosongkan jika tidak ingin mengubah)" : "Password"}
          type="password"
          className={`w-full mb-3 p-2 rounded border border-black/20 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'}`}
          disabled={saving}
        />
        
        <button 
          onClick={saveAccount}
          className="w-full px-4 py-2 rounded bg-olabutton text-white disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </Modal>
    </>
  )
}
