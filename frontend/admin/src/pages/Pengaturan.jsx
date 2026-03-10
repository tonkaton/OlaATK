import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import { configAPI } from '../services/api'

export default function Pengaturan({ dark }) {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const data = await configAPI.getAll()
      setConfigs(data.konfigurasi || [])
      
      const initialData = {}
      data.konfigurasi?.forEach(config => {
        initialData[config.id] = config.nilai
      })
      setFormData(initialData)
      
      setError(null)
    } catch (err) {
      console.error('Error fetching configs:', err)
      setError('Gagal memuat konfigurasi')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const updates = Object.keys(formData).map(id => ({
        id: Number(id),
        nilai: formData[id]
      }))

      await configAPI.batchUpdate(updates)
      setSuccessMessage('Pengaturan berhasil disimpan!')
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error saving configs:', err)
      setError('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const groupConfigs = (configs) => {
    const grouped = {}
    configs.forEach(config => {
      if (!grouped[config.grup]) {
        grouped[config.grup] = []
      }
      grouped[config.grup].push(config)
    })
    
    // Sort groups: 'umum' first, then alphabetically
    const sortedGrouped = {}
    const groupOrder = ['umum', 'kontak', 'tampilan']
    
    // First add ordered groups
    groupOrder.forEach(grup => {
      if (grouped[grup]) {
        sortedGrouped[grup] = grouped[grup]
      }
    })
    
    // Then add any other groups alphabetically
    Object.keys(grouped)
      .filter(grup => !groupOrder.includes(grup))
      .sort()
      .forEach(grup => {
        sortedGrouped[grup] = grouped[grup]
      })
    
    return sortedGrouped
  }

  const getGroupTitle = (grup) => {
    const titles = {
      'umum': 'Umum',
      'kontak': 'Informasi Kontak',
      'tampilan': 'Tampilan'
    }
    return titles[grup] || grup
  }

  if (loading) {
    return (
      <Section dark={dark} title="Pengaturan">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olabutton"></div>
          <p className="mt-2">Memuat pengaturan...</p>
        </div>
      </Section>
    )
  }

  const groupedConfigs = groupConfigs(configs)

  return (
    <Section dark={dark} title="Pengaturan">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-200">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedConfigs).map(([grup, groupConfigs]) => (
          <div key={grup} className="space-y-3">
            <h3 className="text-lg font-semibold text-olabutton">
              {getGroupTitle(grup)}
            </h3>
            
            {groupConfigs.map(config => (
              <div key={config.id} className="space-y-1">
                <label className="block text-sm font-medium">
                  {config.kunci.replace(/_/g, ' ')}
                </label>
                {config.deskripsi && (
                  <p className="text-xs opacity-70">{config.deskripsi}</p>
                )}
                
                {config.tipe === 'textarea' ? (
                  <textarea
                    className="w-full p-2 rounded bg-black/15 resize-none"
                    rows="3"
                    value={formData[config.id] || ''}
                    onChange={(e) => handleChange(config.id, e.target.value)}
                    placeholder={config.kunci}
                  />
                ) : (
                  <input
                    type={config.tipe || 'text'}
                    className="w-full p-2 rounded bg-black/15"
                    value={formData[config.id] || ''}
                    onChange={(e) => handleChange(config.id, e.target.value)}
                    placeholder={config.kunci}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button 
        className="mt-6 px-4 py-2 bg-olabutton rounded text-white hover:bg-olabutton/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </Section>
  )
}
