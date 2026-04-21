import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { servicesAPI, uploadAPI, authAPI, paymentAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { API_BASE_URL } from '../config/constants'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Button from '../components/Button'
import Card from '../components/Card'

// Import PDFJS (LOGIC TETEP SAMA!)
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function Order() {
  const { isAuthenticated, user } = useAuth()
  const fileInputRef = useRef(null)

  // --- STATE (SEMUA LOGIC SAMA!) ---
  const [contactForm, setContactForm] = useState({ name: '', phone: '', alamat: '' })
  const [selectedService, setSelectedService] = useState(null)
  const [priceList, setPriceList] = useState(null)

  const [orderDetails, setOrderDetails] = useState({
    paperSize: 'A4',
    colorMode: 'Hitam Putih',
    copies: 1,
    totalPages: 1,
    bindingType: 'Tidak Ada',
    bwPages: 0,
    colorPages: 0
  })

  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState(null)
  const [fileError, setFileError] = useState('')
  const [isPdf, setIsPdf] = useState(false)

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paymentPending, setPaymentPending] = useState(false)
  const [error, setError] = useState('')
  const [loadingServices, setLoadingServices] = useState(true)

  // Load Midtrans
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '')
    script.async = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && user?.userId && user?.userType === 'user') {
        try {
          const response = await authAPI.getPelangganByUserId(user.userId)
          if (response.success && response.data?.pelanggan) {
            const { nama_lengkap, nomor_telepon, alamat } = response.data.pelanggan
            setContactForm({ name: nama_lengkap || '', phone: nomor_telepon || '', alamat: alamat || '' })
          }
        } catch (err) { console.error(err) }
      }
    }
    fetchUserData()
    fetchPrices()
  }, [isAuthenticated, user])

  // Fetch Services & AUTO SELECT
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.getActive()
        if (response.success && response.data?.dataLayanan) {
          const onlineServices = response.data.dataLayanan.filter(service =>
            service.nama.toLowerCase().includes('cetak') || service.nama.toLowerCase().includes('print')
          )
          setServices(onlineServices)
          // Logic ini yang bikin kita bisa buang UI Pilih Layanan
          if (onlineServices.length > 0) setSelectedService(onlineServices[0])
        }
      } catch (err) {
        const fallback = { id: 1, nama: 'Cetak Dokumen', nama_icon: 'printer' }
        setServices([fallback])
        setSelectedService(fallback)
      } finally { setLoadingServices(false) }
    }
    fetchServices()
  }, [])

  // Fetch Prices
  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/konfigurasi/public`)
      const json = await res.json()
      if (json.success) setPriceList(json.data)
    } catch (error) { console.error("Gagal tarik harga", error) }
  }

  // --- HANDLERS (LOGIC SAMA!) ---
  const handleContactChange = (e) => setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleDetailChange = (key, value) => setOrderDetails(prev => ({ ...prev, [key]: value }))

  // PDF Scanner
  const handleFile = async (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) {
        setFileError('Ukuran file maksimal 20MB')
        return
      }
      setFile(selectedFile)
      setUploadedFileName(null)
      setFileError('')

      if (selectedFile.type === 'application/pdf') {
        setIsPdf(true)
        try {
          const arrayBuffer = await selectedFile.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          setOrderDetails(prev => ({ ...prev, totalPages: pdf.numPages }))
        } catch (err) {
          console.error("Gagal scan PDF:", err)
          setFileError('Gagal membaca PDF. Silakan isi jumlah halaman manual.')
        }
      } else {
        setIsPdf(false)
      }
    }
  }

  const uploadFile = async () => {
    if (!file) return null
    try {
      setUploading(true)
      const response = await uploadAPI.uploadFile(file)
      if (response.success) {
        setUploadedFileName(response.data.fileName)
        return response.data.fileName
      }
      throw new Error(response.message)
    } catch (err) {
      throw new Error('Gagal upload file')
    } finally { setUploading(false) }
  }

  // Smart Calculator
  const hitungTotal = () => {
    if (!priceList || !selectedService) return 0

    let totalPerBundel = 0
    const copies = parseInt(orderDetails.copies) || 1
    const isCetak = selectedService.nama.toLowerCase().includes('cetak') || selectedService.nama.toLowerCase().includes('print')

    if (isCetak) {
      const kertas = orderDetails.paperSize.toLowerCase()
      const hargaBw = parseInt(priceList[`harga_cetak_${kertas}_bw`]) || 0
      const hargaWarna = parseInt(priceList[`harga_cetak_${kertas}_color`]) || 0

      if (orderDetails.colorMode === 'Hitam Putih') {
        totalPerBundel += (parseInt(orderDetails.totalPages) || 0) * hargaBw
      } else if (orderDetails.colorMode === 'Berwarna') {
        totalPerBundel += (parseInt(orderDetails.totalPages) || 0) * hargaWarna
      } else if (orderDetails.colorMode === 'Campur') {
        totalPerBundel += (parseInt(orderDetails.bwPages) || 0) * hargaBw
        totalPerBundel += (parseInt(orderDetails.colorPages) || 0) * hargaWarna
      }
    }

    if (orderDetails.bindingType !== 'Tidak Ada') {
      const type = orderDetails.bindingType.toLowerCase().split(' ')[0]
      const hargaJilid = parseInt(priceList[`harga_jilid_${type}`]) || 0
      totalPerBundel += hargaJilid
    }

    return totalPerBundel * copies
  }

  const generateOrderItems = () => {
    const items = []
    const sName = selectedService?.nama || ''
    const copies = parseInt(orderDetails.copies) || 1
    const kertas = orderDetails.paperSize.toLowerCase()
  
    if (sName.toLowerCase().includes('cetak') || sName.toLowerCase().includes('print')) {
      const hargaBw = parseInt(priceList?.[`harga_cetak_${kertas}_bw`]) || 0
      const hargaWarna = parseInt(priceList?.[`harga_cetak_${kertas}_color`]) || 0
  
      if (orderDetails.colorMode === 'Campur') {
        if (orderDetails.bwPages > 0) items.push({
          nama_barang: `Cetak ${orderDetails.paperSize} (Hitam Putih)`,
          harga_satuan: hargaBw,
          jumlah: parseInt(orderDetails.bwPages) * copies
        })
        if (orderDetails.colorPages > 0) items.push({
          nama_barang: `Cetak ${orderDetails.paperSize} (Berwarna)`,
          harga_satuan: hargaWarna,
          jumlah: parseInt(orderDetails.colorPages) * copies
        })
      } else {
        const harga = orderDetails.colorMode === 'Berwarna' ? hargaWarna : hargaBw
        items.push({
          nama_barang: `Cetak ${orderDetails.paperSize} (${orderDetails.colorMode})`,
          harga_satuan: harga,
          jumlah: (parseInt(orderDetails.totalPages) || 1) * copies
        })
      }
  
      if (orderDetails.bindingType !== 'Tidak Ada') {
        const type = orderDetails.bindingType.toLowerCase().split(' ')[0]
        const hargaJilid = parseInt(priceList?.[`harga_jilid_${type}`]) || 0
        items.push({
          nama_barang: `Jilid ${orderDetails.bindingType}`,
          harga_satuan: hargaJilid,
          jumlah: copies
        })
      }
    } else if (sName.toLowerCase().includes('jilid')) {
      const type = orderDetails.bindingType.toLowerCase().split(' ')[0]
      const hargaJilid = parseInt(priceList?.[`harga_jilid_${type}`]) || 0
      items.push({
        nama_barang: `Jilid ${orderDetails.bindingType}`,
        harga_satuan: hargaJilid,
        jumlah: copies
      })
    } else {
      items.push({
        nama_barang: sName,
        harga_satuan: parseInt(priceList?.[`harga_${sName.toLowerCase()}`]) || 0,
        jumlah: copies
      })
    }
  
    return items
  }

  const resetForm = () => {
    if (!user) setContactForm({ name: '', phone: '', alamat: '' })
    setFile(null); setUploadedFileName(null); setIsPdf(false); setNote('')
    setOrderDetails({ paperSize: 'A4', colorMode: 'Hitam Putih', copies: 1, totalPages: 1, bindingType: 'Tidak Ada', bwPages: 0, colorPages: 0 })
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!contactForm.name || !contactForm.phone || !contactForm.alamat) return setError('Data diri wajib diisi semua')
    const isPrintService = selectedService?.nama.toLowerCase().includes('print') || selectedService?.nama.toLowerCase().includes('cetak')
    if (isPrintService && !file && !uploadedFileName) return setError('Mohon upload dokumen yang ingin dicetak')
    if (isPrintService && orderDetails.colorMode === 'Campur') {
      if (orderDetails.bwPages <= 0 && orderDetails.colorPages <= 0) return setError('Mohon isi jumlah halaman Hitam Putih atau Berwarna')
    }

    const totalHarga = hitungTotal()
    if (totalHarga <= 0) return setError('Total harga tidak valid. Pastikan detail pesanan sudah diisi.')

    try {
      setLoading(true)

      let finalFileName = uploadedFileName
      if (file && !uploadedFileName) {
        try { finalFileName = await uploadFile() }
        catch (uErr) { return setError('Gagal upload file. Cek koneksi internet.') }
      }

      const itemsPayload = generateOrderItems()

      const tokenResponse = await paymentAPI.createToken({
        nama_lengkap: contactForm.name,
        nomor_telepon: contactForm.phone,
        alamat: contactForm.alamat,
        jenis_layanan: selectedService.nama,
        nama_file: finalFileName || null,
        catatan_pesanan: note || null,
        nilai_pesanan: totalHarga,
        items: itemsPayload,
        mode_pesanan: 'ONLINE',
      })

      if (!tokenResponse.success) {
        return setError(tokenResponse.message || 'Gagal membuat transaksi')
      }

      const { snap_token } = tokenResponse.data

      setPaymentPending(true)
      window.snap.pay(snap_token, {
        onSuccess: () => {
          setPaymentPending(false)
          setSuccess(true)
          window.scrollTo(0, 0)
          resetForm()
          setTimeout(() => setSuccess(false), 6000)
        },
        onPending: () => {
          setPaymentPending(false)
          setSuccess(true)
          window.scrollTo(0, 0)
          resetForm()
          setTimeout(() => setSuccess(false), 6000)
        },
        onError: () => {
          setPaymentPending(false)
          setError('Pembayaran gagal. Silakan coba lagi.')
        },
        onClose: () => {
          setPaymentPending(false)
          setError('Pembayaran dibatalkan. Pesanan tersimpan, selesaikan pembayaran untuk diproses.')
        },
      })
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  if (loadingServices) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="svg-spinners:ring-resize" className="text-4xl text-dark" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light pt-32 pb-20">
      <div className="max-w-[56rem] mx-auto px-6 md:px-12">

        {/* HEADER - NEW STYLE */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="border border-border rounded-full px-4 py-1.5">
              <span className="text-xs uppercase tracking-wider font-medium text-dark">Order</span>
            </div>
            <div className="h-[1px] bg-border flex-grow"></div>
          </div>

          <h1 className="font-display text-[2.5rem] md:text-[4.5rem] font-semibold tracking-tighter text-dark leading-[1.1]">
            Buat Pesanan.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-text max-w-2xl font-normal leading-relaxed">
            Upload dokumen Anda, tentukan spesifikasi cetak, dan biarkan sistem kami menghitung estimasi biayanya secara otomatis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">

          {/* STEP 1: DATA PEMESAN */}
          <div>
            <h2 className="font-display text-2xl font-medium mb-6 flex items-center gap-4 text-dark">
              <span className="w-8 h-8 rounded-full border border-dark flex items-center justify-center text-sm font-semibold">1</span> 
              Identitas & Pengiriman
            </h2>
            <Card padding="lg" className="border border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Nama Lengkap"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  disabled={user?.userType === 'user' && contactForm.name}
                  placeholder="Budi Santoso"
                  required
                />
                <Input
                  label="WhatsApp"
                  name="phone"
                  type="tel"
                  value={contactForm.phone}
                  onChange={handleContactChange}
                  disabled={user?.userType === 'user' && contactForm.phone}
                  placeholder="08xxxxxxxx"
                  required
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Alamat Pengiriman / Jemput"
                    name="alamat"
                    value={contactForm.alamat}
                    onChange={handleContactChange}
                    disabled={user?.userType === 'user' && contactForm.alamat}
                    placeholder="Tuliskan alamat lengkap dengan detail patokan..."
                    rows={3}
                    required
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* STEP 2: DETAIL PESANAN */}
          {selectedService && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-display text-2xl font-medium mb-6 flex items-center gap-4 text-dark">
                <span className="w-8 h-8 rounded-full border border-dark flex items-center justify-center text-sm font-semibold">2</span> 
                Spesifikasi Dokumen
              </h2>
              <Card padding="lg" className="border border-border space-y-8">
                
                {/* File Upload - Refined Style */}
                <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                  file 
                    ? 'border-dark bg-dark/5' 
                    : 'border-border hover:border-dark hover:bg-light-gray'
                }`}>
                  <input 
                    type="file" 
                    id="fileUpload" 
                    onChange={handleFile} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.jpg,.png" 
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                    {file ? (
                      <>
                        <Icon icon="solar:document-bold" className="text-dark mb-4 text-5xl" />
                        <span className="text-dark font-semibold text-lg truncate max-w-sm">{file.name}</span>
                        {isPdf && (
                          <span className="text-xs text-dark font-medium bg-white border border-border px-4 py-1.5 rounded-full mt-4 shadow-sm">
                            Terdeteksi {orderDetails.totalPages} Halaman
                          </span>
                        )}
                        <span className="text-sm text-neutral-text mt-4 underline decoration-neutral-light underline-offset-4">Ganti dokumen</span>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white border border-border rounded-full flex items-center justify-center mb-4 shadow-sm">
                          <Icon icon="solar:cloud-upload-linear" className="text-dark text-3xl" />
                        </div>
                        <span className="text-dark font-semibold text-lg">Pilih file untuk diunggah</span>
                        <span className="text-sm text-neutral-text mt-2 max-w-xs">
                          Mendukung PDF, Word, JPG, PNG. (Maks 20MB). Disarankan PDF agar perhitungan otomatis.
                        </span>
                      </>
                    )}
                  </label>
                  {fileError && (
                    <p className="text-red-500 text-sm mt-4 flex items-center justify-center gap-2 font-medium">
                      <Icon icon="solar:danger-circle-bold" />
                      {fileError}
                    </p>
                  )}
                </div>

                {/* Total Pages (If not mixed mode) */}
                {orderDetails.colorMode !== 'Campur' && (
                  <div className="bg-light-gray border border-border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <label className="block text-base font-medium text-dark mb-1">
                        Total Halaman Dokumen
                      </label>
                      <p className="text-sm text-neutral-text">
                        Otomatis terisi jika upload PDF. Sesuaikan jika salah.
                      </p>
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      value={orderDetails.totalPages} 
                      onChange={e => handleDetailChange('totalPages', e.target.value)} 
                      disabled={isPdf} 
                      className={`w-full md:w-32 p-3 text-center text-xl font-bold rounded-xl border transition-colors ${
                        isPdf 
                          ? 'bg-transparent text-dark border-transparent cursor-not-allowed' 
                          : 'bg-white border-border focus:border-dark focus:ring-1 focus:ring-dark outline-none'
                      }`} 
                    />
                  </div>
                )}

                {/* Paper Size & Color Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Ukuran Kertas</label>
                    <div className="flex bg-light-gray p-1.5 rounded-xl border border-border">
                      {['A4', 'F4 (Folio)'].map(size => (
                        <button 
                          key={size} 
                          type="button" 
                          onClick={() => handleDetailChange('paperSize', size.split(' ')[0])} 
                          className={`flex-1 py-3 text-sm rounded-lg transition-all ${
                            orderDetails.paperSize === size.split(' ')[0] 
                              ? 'bg-white shadow-sm border border-border text-dark font-semibold' 
                              : 'text-neutral-text hover:text-dark font-medium'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Mode Warna</label>
                    <div className="flex bg-light-gray p-1.5 rounded-xl border border-border">
                      {['Hitam Putih', 'Berwarna', 'Campur'].map(mode => (
                        <button 
                          key={mode} 
                          type="button" 
                          onClick={() => handleDetailChange('colorMode', mode)} 
                          className={`flex-1 py-3 text-sm rounded-lg transition-all ${
                            orderDetails.colorMode === mode 
                              ? 'bg-white shadow-sm border border-border text-dark font-semibold' 
                              : 'text-neutral-text hover:text-dark font-medium'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Campur Mode Detail - Neutral Styling */}
                <AnimatePresence>
                  {orderDetails.colorMode === 'Campur' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="p-6 bg-light-gray border border-border rounded-2xl overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <span className="text-dark font-semibold flex items-center gap-2">
                          <Icon icon="solar:calculator-linear" className="text-xl" />
                          Rincian Halaman Campur
                        </span>
                        {isPdf && (
                          <span className="text-xs bg-white border border-border text-dark px-3 py-1.5 rounded-full font-medium">
                            Total File: {orderDetails.totalPages} Halaman
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Jml Halaman Hitam Putih"
                          type="number"
                          min="0"
                          value={orderDetails.bwPages}
                          onChange={(e) => handleDetailChange('bwPages', e.target.value)}
                        />
                        <Input
                          label="Jml Halaman Berwarna"
                          type="number"
                          min="0"
                          value={orderDetails.colorPages}
                          onChange={(e) => handleDetailChange('colorPages', e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <hr className="border-border" />

                {/* Binding Type */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-4 uppercase tracking-wider">Jilid Sekalian?</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['Tidak Ada', 'Lakban Biasa', 'Softcover', 'Hardcover', 'Spiral'].map(type => (
                      <div 
                        key={type} 
                        onClick={() => handleDetailChange('bindingType', type)} 
                        className={`cursor-pointer px-4 py-4 border-2 rounded-xl text-sm text-center transition-all flex items-center justify-center ${
                          orderDetails.bindingType === type 
                            ? 'border-dark bg-dark text-white font-semibold shadow-md' 
                            : 'border-border bg-light-gray text-neutral-text hover:border-dark/30 hover:bg-white'
                        }`}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Copies & Notes Container */}
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  {/* Copies */}
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-4 uppercase tracking-wider">
                      Jumlah Rangkap (Bundel)
                    </label>
                    <div className="flex items-center gap-6 bg-light-gray p-2 rounded-2xl w-fit border border-border">
                      <button 
                        type="button" 
                        onClick={() => handleDetailChange('copies', Math.max(1, orderDetails.copies - 1))} 
                        className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center hover:bg-dark hover:text-white hover:border-dark transition-all"
                      >
                        <Icon icon="solar:minus-linear" className="text-xl" />
                      </button>
                      <span className="text-2xl font-bold w-12 text-center text-dark">{orderDetails.copies}</span>
                      <button 
                        type="button" 
                        onClick={() => handleDetailChange('copies', orderDetails.copies + 1)} 
                        className="w-12 h-12 rounded-xl bg-dark text-white flex items-center justify-center hover:opacity-90 transition-all shadow-md"
                      >
                        <Icon icon="solar:add-linear" className="text-xl" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Textarea
                      label="Catatan (Opsional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Contoh: Halaman 1-5 tolong diprint warna, sisanya hitam putih..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Total Price Banner - Premium Look */}
                <div className="mt-6 pt-6 flex flex-col md:flex-row justify-between items-center bg-dark p-8 rounded-2xl shadow-xl">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                    <span className="text-sm font-medium text-white/80 block uppercase tracking-wider mb-1">Estimasi Total</span>
                    <span className="text-xs text-white/50">Sudah termasuk biaya admin</span>
                  </div>
                  <span className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Rp {hitungTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="bg-red-50 border-l-4 border-red-500 text-red-800 p-5 rounded-r-xl flex items-center gap-4 shadow-sm"
              >
                <Icon icon="solar:danger-circle-bold" className="text-2xl shrink-0" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="bg-green-50 border-l-4 border-green-500 text-green-800 p-5 rounded-r-xl flex items-center gap-4 shadow-sm"
              >
                <Icon icon="solar:check-circle-bold" className="text-2xl shrink-0" />
                <div>
                  <p className="font-bold text-lg">Pembayaran Berhasil!</p>
                  <p className="text-sm mt-1 opacity-80">Pesanan Anda masuk antrean dan sedang diproses.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || uploading || success || paymentPending}
              className="w-full py-5 text-lg shadow-lg hover:shadow-xl transition-all font-semibold tracking-wide"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-3">
                  <Icon icon="svg-spinners:ring-resize" className="text-2xl" />
                  Mengunggah Dokumen...
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center gap-3">
                  <Icon icon="svg-spinners:ring-resize" className="text-2xl" />
                  Menyiapkan Pembayaran...
                </span>
              ) : paymentPending ? (
                <span className="flex items-center justify-center gap-3">
                  <Icon icon="svg-spinners:ring-resize" className="text-2xl" />
                  Menunggu Pembayaran...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Lanjutkan ke Pembayaran
                  <Icon icon="solar:arrow-right-linear" className="text-xl" />
                </span>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}