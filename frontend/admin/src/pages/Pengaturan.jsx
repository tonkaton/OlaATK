import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import { configAPI } from '../services/api'
import { Save, CheckCircle, AlertCircle, Settings, ChevronDown } from 'lucide-react'

export default function Pengaturan({ dark }) {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [formData, setFormData] = useState({})
  const [expandedService, setExpandedService] = useState(null) // 'cetak', 'fotokopi', etc
  
  // State baru untuk melacak tab yang aktif
  const [activeGroup, setActiveGroup] = useState('umum')

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

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const updates = Object.keys(formData).map(id => ({
        id: Number(id),
        nilai: String(formData[id])
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

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
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
    
    const sortedGrouped = {}
    const groupOrder = ['umum', 'kontak', 'harga', 'tampilan']
    
    groupOrder.forEach(grup => {
      if (grouped[grup]) {
        sortedGrouped[grup] = grouped[grup]
      }
    })
    
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
      'kontak': 'Kontak',
      'harga': 'Matriks Harga',
      'tampilan': 'Tampilan UI'
    }
    return titles[grup] || grup.toUpperCase()
  }

  // GROUP HARGA BY SERVICE
  const groupHargaByService = (hargaConfigs) => {
    const services = {
      'cetak': { label: 'Harga Cetak', configs: [] },
      'fotokopi': { label: 'Harga Fotokopi', configs: [] },
      'laminating': { label: 'Harga Laminating', configs: [] },
      'jilid': { label: 'Harga Jilid', configs: [] },
      'scan': { label: 'Harga Scan', configs: [] }
    }

    hargaConfigs.forEach(config => {
      if (config.kunci.includes('cetak')) services.cetak.configs.push(config)
      else if (config.kunci.includes('fotokopi')) services.fotokopi.configs.push(config)
      else if (config.kunci.includes('laminating')) services.laminating.configs.push(config)
      else if (config.kunci.includes('jilid')) services.jilid.configs.push(config)
      else if (config.kunci.includes('scan')) services.scan.configs.push(config)
    })

    return Object.entries(services).filter(([_, s]) => s.configs.length > 0)
  }

  const renderHargaCollapse = (hargaConfigs) => {
    const serviceGroups = groupHargaByService(hargaConfigs)

    return (
      <div className="space-y-3">
        {serviceGroups.map(([serviceKey, serviceData]) => (
          <div key={serviceKey} className={`border rounded-xl overflow-hidden ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
            {/* COLLAPSE HEADER */}
            <button
              type="button"
              onClick={() => setExpandedService(expandedService === serviceKey ? null : serviceKey)}
              className={`w-full px-6 py-4 flex items-center justify-between font-bold text-sm transition ${
                expandedService === serviceKey
                  ? dark ? 'bg-slate-700 text-olaTosca' : 'bg-olaTosca/10 text-olaTosca'
                  : dark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <span>{serviceData.label}</span>
              <ChevronDown 
                size={18} 
                className={`transition ${expandedService === serviceKey ? 'rotate-180' : ''}`}
              />
            </button>

            {/* COLLAPSE CONTENT */}
            {expandedService === serviceKey && (
              <div className={`p-6 space-y-4 border-t ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-100 bg-gray-50'}`}>
                {serviceData.configs.map(config => (
                  <div key={config.id}>
                    <label className="block text-xs font-bold uppercase opacity-60 mb-2">
                      {config.kunci.replace(/_/g, ' ')}
                    </label>
                    {config.deskripsi && (
                      <p className="text-xs opacity-50 mb-1.5 italic">{config.deskripsi}</p>
                    )}
                    
                    {config.tipe === 'textarea' ? (
                      <textarea
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-olaTosca outline-none resize-none transition ${dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                        rows="2"
                        value={formData[config.id] || ''}
                        onChange={(e) => handleChange(config.id, e.target.value)}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder={`Masukkan ${config.kunci}`}
                      />
                    ) : (
                      <input
                        type={config.tipe === 'number' ? 'number' : 'text'}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-olaTosca outline-none transition ${dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                        value={formData[config.id] || ''}
                        onChange={(e) => handleChange(config.id, e.target.value)}
                        placeholder={`Masukkan ${config.kunci}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Section dark={dark} title="Pengaturan Sistem">
        <div className="text-center py-20 opacity-60">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olaTosca mb-4"></div>
          <p>Memuat konfigurasi...</p>
        </div>
      </Section>
    )
  }

  const groupedConfigs = groupConfigs(configs)
  const availableGroups = Object.keys(groupedConfigs)
  
  const currentGroup = availableGroups.includes(activeGroup) ? activeGroup : availableGroups[0]

  return (
    <Section dark={dark} title="Pengaturan Sistem">
      <form onSubmit={handleSave} className="relative">
        
        {/* --- STICKY TOP BAR --- */}
        <div className={`sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 mb-6 rounded-xl shadow-sm backdrop-blur-xl border ${dark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-gray-200'}`}>
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2"><Settings size={18} className="text-olaTosca"/> Konfigurasi Aplikasi</h2>
            <p className="text-xs opacity-70 mt-1">
              Expand kategori untuk edit. Tekan <kbd className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${dark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Ctrl+Enter</kbd> untuk simpan cepat.
            </p>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-2.5 bg-olaTosca text-white rounded-lg hover:opacity-90 transition font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
          >
            <Save size={16}/> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>

        {/* --- ALERTS --- */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
            <AlertCircle size={18}/> <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-600">
            <CheckCircle size={18}/> <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* --- TAB NAVIGATION (PILLS) --- */}
        <div className="flex flex-wrap gap-2 mb-6">
          {availableGroups.map(grup => (
            <button
              key={grup}
              type="button"
              onClick={() => setActiveGroup(grup)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                currentGroup === grup 
                  ? 'bg-olaTosca text-white shadow-md' 
                  : dark 
                    ? 'bg-slate-800 text-gray-400 hover:bg-slate-700' 
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {getGroupTitle(grup)}
            </button>
          ))}
        </div>

        {/* --- ACTIVE GROUP CONTENT --- */}
        {currentGroup && (
          <div className={`p-6 rounded-2xl border shadow-sm animate-in fade-in slide-in-from-bottom-2 ${dark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-100'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 opacity-60 border-b pb-3 border-dashed">
              {getGroupTitle(currentGroup)}
            </h3>
            
            {/* SPECIAL RENDER UNTUK HARGA GROUP */}
            {currentGroup === 'harga' ? (
              renderHargaCollapse(groupedConfigs[currentGroup])
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {groupedConfigs[currentGroup].map(config => (
                  <div key={config.id} className={config.tipe === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-bold mb-1 capitalize">
                      {config.kunci.replace(/_/g, ' ')}
                    </label>
                    {config.deskripsi && (
                      <p className="text-xs opacity-60 mb-2">{config.deskripsi}</p>
                    )}
                    
                    {config.tipe === 'textarea' ? (
                      <textarea
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-olaTosca outline-none resize-none transition ${dark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                        rows="3"
                        value={formData[config.id] || ''}
                        onChange={(e) => handleChange(config.id, e.target.value)}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder={`Masukkan ${config.kunci}`}
                      />
                    ) : (
                      <input
                        type={config.tipe === 'number' ? 'number' : 'text'}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-olaTosca outline-none transition ${dark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                        value={formData[config.id] || ''}
                        onChange={(e) => handleChange(config.id, e.target.value)}
                        placeholder={`Masukkan ${config.kunci}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </form>
    </Section>
  )
}