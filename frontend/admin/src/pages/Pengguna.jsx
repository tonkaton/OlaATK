import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import Pagination from '../components/Pagination'
import { usersAPI } from '../services/api'

export default function Pengguna({ dark }) {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })
  
  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getAll(page, search)
      setUsers(response.pelanggan || [])
      setPagination(response.pagination || { total: 0, totalPages: 0, limit: 10 })
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      return
    }

    try {
      await usersAPI.delete(id)
      fetchUsers()
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to delete user')
      console.error('Error deleting user:', err)
    }
  }

  return (
    <Section dark={dark} title="Data Pengguna" search={search} setSearch={setSearch}>
      {error && (
        <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {users.map(u => (
            <div key={u.id} className="flex justify-between p-3 rounded-lg bg-white/6 mb-2">
              <div>
                <div className="font-medium">{u.nama_lengkap}</div>
                <div className="text-sm opacity-70">{u.nomor_telepon}</div>
                {u.alamat && (
                  <div className="text-sm opacity-60 mt-1">
                    📍 {u.alamat}
                  </div>
                )}
                {u.akunPelanggan && (
                  <div className="text-xs opacity-60 mt-1">
                    Email: {u.akunPelanggan.email}
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleDelete(u.id)} 
                className="text-red-400 hover:text-red-500"
              >
                Hapus
              </button>
            </div>
          ))}
          <Pagination page={page} setPage={setPage} maxPage={pagination.totalPages} />
        </>
      )}
    </Section>
  )
}
