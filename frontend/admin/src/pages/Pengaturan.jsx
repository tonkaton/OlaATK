import React, { useState, useEffect } from 'react'
import { configAPI } from '../services/api'
import { Save, CheckCircle, AlertCircle, Settings, ChevronDown, Phone, DollarSign, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 focus:border-olaTosca/60 transition"

const groupIcons = {
  umum:     Settings,
  kontak:   Phone,
  harga:    DollarSign,
  tampilan: Palette,
}

export default function Pengaturan({ dark }) {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [formData, setFormData] = useState({})
  const [expandedService, setExpandedService] = useState(null)
  const [activeGroup, setActiveGroup] = useState('umum')

  useEffect(() => { fetchConfigs() }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const data = await configAPI.getAll()
      setConfigs(data.konfigurasi || [])
      const initialData = {}
      data.konfigurasi?.forEach(c => { initialData[c.id] = c.nilai })
      setFormData(initialData)
      setError(null)
    } catch { setError('Gagal memuat konfigurasi') }
    finally { setLoading(false) }
  }

  const handleChange = (id, value) => setFormData(prev => ({ ...prev, [id]: value }))

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      const updates = Object.keys(formData).map(id => ({ id: Number(id), nilai: String(formData[id]) }))
      await configAPI.batchUpdate(updates)
      setSuccessMessage('Pengaturan berhasil disimpan!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch { setError('Gagal menyimpan pengaturan') }
    finally { setSaving(false) }
  }

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave() }
  }

  const groupConfigs = (configs) => {
    const grouped = {}
    configs.forEach(c => {
      if (!grouped[c.grup]) grouped[c.grup] = []
      grouped[c.grup].push(c)
    })
    const order = ['umum', 'kontak', 'harga', 'tampilan']
    const sorted = {}
    order.forEach(g => { if (grouped[g]) sorted[g] = grouped[g] })
    Object.keys(grouped).filter(g => !order.includes(g)).sort().forEach(g => { sorted[g] = grouped[g] })
    return sorted
  }

  const getGroupTitle = (grup) => ({ umum: 'Umum', kontak: 'Kontak', harga: 'Matriks Harga', tampilan: 'Tampilan UI' }[grup] || grup.toUpperCase())

  const groupHargaByService = (hargaConfigs) => {
    const services = {
      cetak:      { label: 'Harga Cetak',      configs: [] },
      fotokopi:   { label: 'Harga Fotokopi',   configs: [] },
      laminating: { label: 'Harga Laminating', configs: [] },
      jilid:      { label: 'Harga Jilid',      configs: [] },
      scan:       { label: 'Harga Scan',        configs: [] },
    }
    hargaConfigs.forEach(c => {
      if (c.kunci.includes('cetak')) services.cetak.configs.push(c)
      else if (c.kunci.includes('fotokopi')) services.fotokopi.configs.push(c)
      else if (c.kunci.includes('laminating')) services.laminating.configs.push(c)
      else if (c.kunci.includes('jilid')) services.jilid.configs.push(c)
      else if (c.kunci.includes('scan')) services.scan.configs.push(c)
    })
    return Object.entries(services).filter(([_, s]) => s.configs.length > 0)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-6 h-6 rounded-full border-2 border-olaTosca border-t-transparent" />
    </div>
  )

  const groupedConfigs = groupConfigs(configs)
  const availableGroups = Object.keys(groupedConfigs)
  const currentGroup = availableGroups.includes(activeGroup) ? activeGroup : availableGroups[0]

  return (
    <form onSubmit={handleSave} className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-olaTosca" /> Pengaturan Sistem
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Ctrl+Enter</kbd> untuk simpan cepat
          </p>
        </div>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-olaTosca hover:bg-olaTosca/90 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-olaTosca/10 border border-olaTosca/20 rounded-lg text-olaTosca text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMessage}
        </div>
      )}

      {/* Group Tabs with Icons */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl w-fit border border-border">
        {availableGroups.map(grup => {
          const Icon = groupIcons[grup]
          return (
            <button key={grup} type="button" onClick={() => setActiveGroup(grup)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
                currentGroup === grup
                  ? 'bg-card text-foreground shadow border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}>
              {Icon && <Icon size={15} />}
              {getGroupTitle(grup)}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{getGroupTitle(currentGroup)}</h3>
        </div>

        <div className="p-4">
          {currentGroup === 'harga' ? (
            // Harga group — collapsible per service
            <div className="space-y-2">
              {groupHargaByService(groupedConfigs[currentGroup]).map(([serviceKey, serviceData]) => (
                <div key={serviceKey} className="border border-border rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setExpandedService(expandedService === serviceKey ? null : serviceKey)}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between text-sm font-medium transition',
                      expandedService === serviceKey
                        ? 'bg-olaTosca/10 text-olaTosca border-b border-olaTosca/20'
                        : 'text-foreground hover:bg-muted/30'
                    )}>
                    {serviceData.label}
                    <ChevronDown size={15} className={cn('transition', expandedService === serviceKey && 'rotate-180')} />
                  </button>
                  {expandedService === serviceKey && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/10">
                      {serviceData.configs.map(config => (
                        <div key={config.id}>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                            {config.deskripsi || config.kunci.replace(/_/g, ' ')}
                          </label>
                          <div className="relative">
                            {config.tipe === 'number' && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                            )}
                            <input
                              type="number"
                              className={cn(inputClass, config.tipe === 'number' && 'pl-8')}
                              value={formData[config.id] || ''}
                              onChange={e => handleChange(config.id, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Grup lain — grid biasa
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedConfigs[currentGroup].map(config => (
                <div key={config.id} className={config.tipe === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 capitalize">
                    {config.deskripsi || config.kunci.replace(/_/g, ' ')}
                  </label>
                  {config.tipe === 'textarea' ? (
                    <textarea
                      rows="3"
                      className={inputClass}
                      value={formData[config.id] || ''}
                      onChange={e => handleChange(config.id, e.target.value)}
                      onKeyDown={handleTextareaKeyDown}
                    />
                  ) : (
                    <input
                      type={config.tipe === 'number' ? 'number' : config.tipe === 'tel' ? 'tel' : 'text'}
                      className={inputClass}
                      value={formData[config.id] || ''}
                      onChange={e => handleChange(config.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </form>
  )
}