import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { trackAPI } from '../services/api'
import Card from '../components/Card'

export default function Track() {
  const [searchParams] = useSearchParams()
  const [kode, setKode] = useState('')
  const [mode, setMode] = useState('idle') // idle | loading | found | notfound | limited | error
  const [pesanan, setPesanan] = useState(null)
  const [formError, setFormError] = useState('')

  // noindex biar halaman hasil tracking ga ke-index search engine
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => document.head.removeChild(meta)
  }, [])

  // Auto-lacak kalo URL ada ?kode=
  useEffect(() => {
    const paramKode = searchParams.get('kode')
    if (paramKode) {
      setKode(paramKode)
      handleLacak(paramKode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLacak = async (rawKode = kode) => {
    const cleaned = rawKode.replace(/[^a-zA-Z0-9]/g, '')
    if (cleaned.length < 6) {
      setFormError('Kode minimal 6 karakter. Cek email konfirmasi kamu.')
      setMode('idle')
      return
    }
    setFormError('')
    setMode('loading')
    try {
      const response = await trackAPI.getByCode(cleaned)
      if (response.success) {
        setPesanan(response.data.pesanan)
        setMode('found')
      } else {
        setMode(response.statusCode === 429 ? 'limited' : 'notfound')
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 429) setMode('limited')
      else if (status === 404) setMode('notfound')
      else setMode('error')
    }
  }

  const statusConfig = {
    'MENUNGGU': { label: 'Menunggu', icon: 'solar:clock-circle-linear', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    'DIPROSES': { label: 'Diproses', icon: 'svg-spinners:ring-resize', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    'SELESAI': { label: 'Selesai', icon: 'solar:check-circle-bold', style: 'bg-green-50 text-green-700 border-green-200' },
    'BATAL': { label: 'Batal', icon: 'solar:close-circle-bold', style: 'bg-red-50 text-red-700 border-red-200' },
  }

  // Progress timeline: 3 langkah — Dipesan → Diproses → Selesai
  const timelineSteps = ['Dipesan', 'Diproses', 'Selesai']
  const progressIndex = pesanan
    ? pesanan.status === 'SELESAI' ? 3
      : pesanan.status === 'DIPROSES' ? 2
        : pesanan.status === 'BATAL' ? 0 : 1
    : 0

  const messages = {
    notfound: {
      title: 'Kode tidak ditemukan',
      body: 'Cek email konfirmasi kamu, atau pastikan kode yang diketik bener.',
      icon: 'solar:search-failed-bold',
    },
    limited: {
      title: 'Kebanyakan percobaan',
      body: 'Tunggu sebentar, ya. Lalu coba lagi.',
      icon: 'solar:clock-circle-bold',
    },
    error: {
      title: 'Gagal melacak',
      body: 'Ada gangguan sistem. Coba lagi sebentar lagi.',
      icon: 'solar:danger-triangle-bold',
    },
  }

  return (
    <div className="min-h-screen bg-light pt-32 pb-20">
      <div className="max-w-[56rem] mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="border border-border rounded-full px-4 py-1.5 bg-white shadow-sm">
              <span className="text-xs uppercase tracking-wider font-semibold text-dark">Lacak Pesanan</span>
            </div>
            <div className="h-[1px] bg-border flex-grow"></div>
          </div>
          <h1 className="font-display text-[2.5rem] md:text-[4.5rem] font-semibold tracking-tighter text-dark leading-[1.1]">
            Di mana pesananmu?
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-text max-w-2xl font-normal leading-relaxed">
            Masukkan kode lacak dari email konfirmasi kamu — tanpa perlu daftar akun.
          </p>
        </div>

        {/* Form */}
        <Card padding="lg" className="border-border bg-white shadow-sm">
          <form
            onSubmit={(e) => { e.preventDefault(); handleLacak() }}
            className="flex flex-col md:flex-row gap-3"
          >
            <input
              type="text"
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              placeholder="Contoh: OLA-ABC123"
              className="flex-1 px-5 py-4 rounded-xl border border-border bg-light-gray focus:outline-none focus:ring-2 focus:ring-dark/20 focus:border-dark transition-all text-dark font-medium tracking-wide placeholder:text-neutral-light"
            />
            <button
              type="submit"
              disabled={mode === 'loading'}
              className="inline-flex items-center justify-center gap-2 bg-dark text-white px-8 py-4 rounded-xl font-semibold hover:bg-dark/90 transition-colors shadow-md disabled:opacity-60"
            >
              {mode === 'loading' ? (
                <Icon icon="svg-spinners:ring-resize" className="text-xl" />
              ) : (
                <>
                  Lacak <Icon icon="solar:arrow-right-linear" />
                </>
              )}
            </button>
          </form>
          {formError && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-2">
              <Icon icon="solar:danger-circle-linear" className="text-lg" />
              {formError}
            </p>
          )}
        </Card>

        {/* Hasil / State */}
        <AnimatePresence mode="wait">
          {mode === 'found' && pesanan && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Status Card */}
              <Card padding="lg" className="border-border bg-white shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${(statusConfig[pesanan.status] || statusConfig['MENUNGGU']).style}`}>
                        <Icon icon={statusConfig[pesanan.status]?.icon || 'solar:clock-circle-linear'} className="text-sm" />
                        {(statusConfig[pesanan.status] || statusConfig['MENUNGGU']).label}
                      </span>
                      <span className="text-xs text-neutral-light font-mono tracking-wider">{pesanan.tracking_code}</span>
                    </div>
                    <h2 className="font-display text-2xl font-semibold text-dark tracking-tight">
                      {pesanan.jenis_layanan}
                    </h2>
                    <p className="text-neutral-text text-sm mt-1">
                      {pesanan.pelanggan?.nama_lengkap ? `Pesanan atas nama ${pesanan.pelanggan.nama_lengkap}` : ''} ·{' '}
                      {new Date(pesanan.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-text font-bold uppercase tracking-wider block mb-1">Total Biaya</span>
                    <span className="font-display text-2xl md:text-3xl font-bold text-dark tracking-tight">
                      Rp {pesanan.nilai_pesanan.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-8">
                  {pesanan.status === 'BATAL' ? (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                      <Icon icon="solar:close-circle-bold" className="text-2xl shrink-0" />
                      <div>
                        <p className="font-bold">Pesanan dibatalkan</p>
                        <p className="text-sm">Kalau kamu sudah bayar, hubungi toko ya.</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        {timelineSteps.map((step, i) => (
                          <React.Fragment key={step}>
                            {i > 0 && (
                              <div className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i < progressIndex ? 'bg-dark' : 'bg-light-gray'}`}></div>
                            )}
                            <div className="flex flex-col items-center gap-1.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${
                                i < progressIndex ? 'bg-dark text-white' : 'bg-light-gray text-neutral-light'
                              }`}>
                                {i < progressIndex ? (
                                  <Icon icon="solar:check-bold" className="text-sm" />
                                ) : (
                                  <Icon icon="solar:circle-outline" className="text-sm" />
                                )}
                              </div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 px-1">
                        {timelineSteps.map((step, i) => (
                          <span key={step} className={`text-xs font-semibold uppercase tracking-wider ${i < progressIndex ? 'text-dark' : 'text-neutral-light'}`}>
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Detail Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Items */}
                <Card padding="lg" className="border-border bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-dark uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon icon="solar:box-linear" className="text-lg" />
                    Rincian Item
                  </h4>
                  {pesanan.barangTerbeli?.length > 0 ? (
                    <ul className="space-y-3">
                      {pesanan.barangTerbeli.map((item, idx) => (
                        <li key={idx} className="flex items-start justify-between gap-4 text-sm">
                          <div className="flex items-start gap-3">
                            <div className="mt-1.5 w-1.5 h-1.5 bg-dark rounded-full shrink-0"></div>
                            <div>
                              <span className="text-dark font-medium block leading-tight">{item.nama_barang}</span>
                              <span className="text-neutral-text text-xs">Qty: {item.jumlah}</span>
                            </div>
                          </div>
                          <span className="text-dark font-semibold whitespace-nowrap">
                            Rp {(item.harga_satuan * item.jumlah).toLocaleString('id-ID')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-neutral-text italic">Menunggu input rincian dari admin.</p>
                  )}
                </Card>

                {/* Pengiriman & Info */}
                <Card padding="lg" className="border-border bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-dark uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon icon="solar:truck-linear" className="text-lg" />
                    Pengiriman
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Icon icon={pesanan.metode_pengiriman === 'DIANTAR' ? 'solar:truck-bold' : 'solar:shop-bold'} className="text-xl text-neutral-light" />
                      <div>
                        <p className="text-dark font-medium">
                          {pesanan.metode_pengiriman === 'DIANTAR' ? 'Diantar' : 'Ambil di Toko'}
                        </p>
                        {pesanan.metode_pengiriman === 'DIANTAR' && pesanan.alamat_pengiriman && (
                          <p className="text-neutral-text text-xs mt-0.5">{pesanan.alamat_pengiriman}</p>
                        )}
                      </div>
                    </div>
                    {pesanan.ongkir > 0 && (
                      <div className="flex justify-between border-t border-dashed border-border pt-3">
                        <span className="text-neutral-text font-medium">Ongkir</span>
                        <span className="font-bold text-dark">Rp {pesanan.ongkir.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {pesanan.sisi_cetak === 'DUA_SISI' && (
                      <div className="flex justify-between border-t border-dashed border-border pt-3">
                        <span className="text-neutral-text font-medium">Cetak</span>
                        <span className="font-bold text-dark">Bolak-Balik</span>
                      </div>
                    )}
                    {pesanan.gramasi && (
                      <div className="flex justify-between border-t border-dashed border-border pt-3">
                        <span className="text-neutral-text font-medium">Kertas</span>
                        <span className="font-bold text-dark">{pesanan.gramasi}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {mode !== 'found' && mode !== 'loading' && mode !== 'idle' && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <Card padding="lg" className="text-center py-16 border-border bg-white shadow-sm">
                <div className="w-20 h-20 bg-light-gray rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon icon={messages[mode].icon} className="text-4xl text-dark" />
                </div>
                <h3 className="font-display text-2xl font-medium text-dark mb-2 tracking-tight">
                  {messages[mode].title}
                </h3>
                <p className="text-neutral-text text-sm max-w-sm mx-auto">{messages[mode].body}</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
