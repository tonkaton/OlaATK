import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { servicesAPI, uploadAPI, authAPI, paymentAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Printer, Book, Copy, Layers, UploadCloud, FileText, CheckCircle, AlertCircle, Plus, Minus, Calculator } from 'lucide-react'
import { API_BASE_URL } from '../config/constants'

// Import PDFJS buat Scanner
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function Order() {
  const { isAuthenticated, user } = useAuth()
  const fileInputRef = useRef(null)

  // --- STATE DATA DIRI ---
  const [contactForm, setContactForm] = useState({ name: '', phone: '', alamat: '' })

  // --- STATE LOGIC PEMESANAN ---
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

  // --- STATE SYSTEM ---
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paymentPending, setPaymentPending] = useState(false)
  const [error, setError] = useState('')
  const [loadingServices, setLoadingServices] = useState(true)

  // Load Midtrans Snap.js
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

  // 1. Fetch User Data
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

  // 2. Fetch Services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.getActive()
        if (response.success && response.data?.dataLayanan) {
          const onlineServices = response.data.dataLayanan.filter(service =>
            service.nama.toLowerCase().includes('cetak') || service.nama.toLowerCase().includes('print')
          )
          setServices(onlineServices)
          if (onlineServices.length > 0) setSelectedService(onlineServices[0])
        }
      } catch (err) {
        setServices([{ id: 1, nama: 'Cetak Dokumen', nama_icon: 'printer' }])
      } finally { setLoadingServices(false) }
    }
    fetchServices()
  }, [])

  // 3. Fetch Harga dari DB
  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/konfigurasi/public`)
      const json = await res.json()
      if (json.success) setPriceList(json.data)
    } catch (error) { console.error("Gagal tarik harga", error) }
  }

  // --- HANDLERS ---
  const handleContactChange = (e) => setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleServiceSelect = (service) => {
    setSelectedService(service)
    if (!service.nama.toLowerCase().includes('cetak')) {
      setFile(null); setUploadedFileName(null); setIsPdf(false)
    }
  }

  const handleDetailChange = (key, value) => setOrderDetails(prev => ({ ...prev, [key]: value }))

  // --- LOGIC PDF SCANNER ---
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

  // --- SMART CALCULATOR ---
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

    if (sName.toLowerCase().includes('cetak') || sName.toLowerCase().includes('print')) {
      if (orderDetails.colorMode === 'Campur') {
        if (orderDetails.bwPages > 0) items.push({ nama_barang: `Cetak ${orderDetails.paperSize} (Hitam Putih)`, harga_satuan: 0, jumlah: parseInt(orderDetails.bwPages) * copies })
        if (orderDetails.colorPages > 0) items.push({ nama_barang: `Cetak ${orderDetails.paperSize} (Berwarna)`, harga_satuan: 0, jumlah: parseInt(orderDetails.colorPages) * copies })
      } else {
        items.push({
          nama_barang: `Cetak ${orderDetails.paperSize} (${orderDetails.colorMode})`,
          harga_satuan: 0,
          jumlah: (parseInt(orderDetails.totalPages) || 1) * copies
        })
      }
      if (orderDetails.bindingType !== 'Tidak Ada') {
        items.push({ nama_barang: `Jilid ${orderDetails.bindingType}`, harga_satuan: 0, jumlah: copies })
      }
    } else if (sName.toLowerCase().includes('jilid')) {
      items.push({ nama_barang: `Jilid ${orderDetails.bindingType}`, harga_satuan: 0, jumlah: copies })
    } else {
      items.push({ nama_barang: sName, harga_satuan: 0, jumlah: copies })
    }

    return items
  }

  const resetForm = () => {
    if (!user) setContactForm({ name: '', phone: '', alamat: '' })
    setFile(null); setUploadedFileName(null); setIsPdf(false); setNote('')
    setOrderDetails({ paperSize: 'A4', colorMode: 'Hitam Putih', copies: 1, totalPages: 1, bindingType: 'Tidak Ada', bwPages: 0, colorPages: 0 })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!contactForm.name || !contactForm.phone || !contactForm.alamat) return setError('Data diri wajib diisi semua')
    const isPrintService = selectedService?.nama.toLowerCase().includes('cetak')
    if (isPrintService && !file && !uploadedFileName) return setError('Mohon upload dokumen yang ingin dicetak')
    if (isPrintService && orderDetails.colorMode === 'Campur') {
      if (orderDetails.bwPages <= 0 && orderDetails.colorPages <= 0) return setError('Mohon isi jumlah halaman Hitam Putih atau Berwarna')
    }

    const totalHarga = hitungTotal()
    if (totalHarga <= 0) return setError('Total harga tidak valid. Pastikan detail pesanan sudah diisi.')

    try {
      setLoading(true)

      // 1. Upload file dulu kalau ada
      let finalFileName = uploadedFileName
      if (file && !uploadedFileName) {
        try { finalFileName = await uploadFile() }
        catch (uErr) { return setError('Gagal upload file. Cek koneksi internet.') }
      }

      // 2. Hitung harga per item untuk Midtrans
      const itemsPayload = generateOrderItems().map(item => ({
        ...item,
        harga_satuan: item.jumlah > 0 ? Math.round(totalHarga / generateOrderItems().reduce((s, i) => s + i.jumlah, 0)) : 0
      }))

      // 3. Request snap token ke backend
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

      // 4. Buka Snap popup
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

  const getIcon = (iconName) => {
    switch (iconName?.toLowerCase()) {
      case 'printer': return <Printer size={24} />
      case 'book': return <Book size={24} />
      case 'copy': return <Copy size={24} />
      case 'layers': return <Layers size={24} />
      default: return <FileText size={24} />
    }
  }

  if (loadingServices) return <div className="text-center py-20">Memuat Layanan...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      <div className="text-left mb-10 mt-6">
        <h1 className="text-3xl font-bold text-gray-800">Buat Pesanan Baru</h1>
        <p className="text-gray-500 mt-2">Pilih layanan, upload file, dan lihat estimasi harga otomatis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. DATA PEMESAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="bg-olaTosca text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Data Pemesan</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input name="name" value={contactForm.name} onChange={handleContactChange} disabled={user?.userType === 'user' && contactForm.name} className="w-full mt-1 p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-olaTosca outline-none" placeholder="Budi Santoso" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">WhatsApp</label>
              <input name="phone" value={contactForm.phone} onChange={handleContactChange} disabled={user?.userType === 'user' && contactForm.phone} className="w-full mt-1 p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-olaTosca outline-none" placeholder="08xxxxxxxx" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Alamat Pengiriman / Jemput</label>
              <textarea name="alamat" value={contactForm.alamat} onChange={handleContactChange} disabled={user?.userType === 'user' && contactForm.alamat} className="w-full mt-1 p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-olaTosca outline-none" rows="2" placeholder="Jl. Mawar No. 12..." />
            </div>
          </div>
        </div>

        {/* 2. PILIH LAYANAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="bg-olaTosca text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Pilih Layanan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map(srv => (
              <div key={srv.id} onClick={() => handleServiceSelect(srv)} className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 h-32 ${selectedService?.id === srv.id ? 'border-olaTosca bg-olaTosca/5 text-olaTosca' : 'border-gray-100 hover:border-olaTosca/50 text-gray-600'}`}>
                {getIcon(srv.nama_icon)}
                <span className="text-sm font-medium">{srv.nama}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. DETAIL PESANAN */}
        {selectedService && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="bg-olaTosca text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> Detail {selectedService.nama}</h2>

            <div className="space-y-6">
              {selectedService.nama.toLowerCase().includes('cetak') && (
                <>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-olaTosca'}`}>
                    <input type="file" id="fileUpload" onChange={handleFile} className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" />
                    <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                      {file ? (
                        <>
                          <CheckCircle className="text-green-500 mb-2" size={32} />
                          <span className="text-green-700 font-medium truncate max-w-xs">{file.name}</span>
                          {isPdf && <span className="text-xs text-green-700 font-bold bg-green-200 px-2 py-1 rounded mt-2">Terdeteksi {orderDetails.totalPages} Halaman</span>}
                          <span className="text-xs text-green-600 mt-1">Klik untuk ganti file</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="text-gray-400 mb-2" size={32} />
                          <span className="text-gray-600 font-medium">Klik untuk Upload Dokumen</span>
                          <span className="text-xs text-gray-400 mt-1">Sangat disarankan PDF agar harga terhitung otomatis.</span>
                        </>
                      )}
                    </label>
                    {fileError && <p className="text-red-500 text-xs mt-2">{fileError}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {orderDetails.colorMode !== 'Campur' && (
                      <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-bold text-blue-800 mb-1">Total Halaman Dokumen</label>
                          <p className="text-xs text-blue-600">Pastikan sesuai dengan isi file Anda per 1 bundel.</p>
                        </div>
                        <input type="number" min="1" value={orderDetails.totalPages} onChange={e => handleDetailChange('totalPages', e.target.value)} disabled={isPdf} className={`w-24 p-2 text-center text-lg font-bold rounded-lg border ${isPdf ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none'}`} />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran Kertas</label>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['A4', 'F4 (Folio)'].map(size => (
                          <button key={size} type="button" onClick={() => handleDetailChange('paperSize', size.split(' ')[0])} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${orderDetails.paperSize === size.split(' ')[0] ? 'bg-white shadow text-olaTosca' : 'text-gray-500'}`}>
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mode Warna</label>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['Hitam Putih', 'Berwarna', 'Campur'].map(mode => (
                          <button key={mode} type="button" onClick={() => handleDetailChange('colorMode', mode)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${orderDetails.colorMode === mode ? 'bg-white shadow text-olaTosca' : 'text-gray-500'}`}>
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {orderDetails.colorMode === 'Campur' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-orange-800 font-medium flex items-center gap-2"><Calculator size={18} /> Detail Halaman (Per 1 Bundel)</span>
                        {isPdf && <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded font-bold">Total File: {orderDetails.totalPages} Halaman</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Jml Halaman Hitam Putih</label>
                          <input type="number" min="0" value={orderDetails.bwPages} onChange={(e) => handleDetailChange('bwPages', e.target.value)} className="w-full p-2 rounded border border-gray-300 focus:ring-olaTosca focus:border-olaTosca" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Jml Halaman Berwarna</label>
                          <input type="number" min="0" value={orderDetails.colorPages} onChange={(e) => handleDetailChange('colorPages', e.target.value)} className="w-full p-2 rounded border border-gray-300 focus:ring-olaTosca focus:border-olaTosca" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jilid Sekalian?</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {['Tidak Ada', 'Lakban Biasa', 'Softcover', 'Hardcover', 'Spiral'].map(type => (
                        <div key={type} onClick={() => handleDetailChange('bindingType', type)} className={`cursor-pointer px-3 py-2 border rounded-lg text-sm text-center ${orderDetails.bindingType === type ? 'border-olaTosca bg-olaTosca/10 text-olaTosca' : 'border-gray-200 text-gray-600'}`}>
                          {type}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedService.nama.toLowerCase().includes('jilid') && !selectedService.nama.toLowerCase().includes('cetak') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Jilid</label>
                  <select value={orderDetails.bindingType} onChange={(e) => handleDetailChange('bindingType', e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                    <option value="Lakban Biasa">Lakban Biasa</option>
                    <option value="Softcover">Softcover (Jilid Buku)</option>
                    <option value="Hardcover">Hardcover (Skripsi)</option>
                    <option value="Spiral">Jilid Spiral Kawat</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Rangkap (Berapa bundel yang dicetak?)</label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => handleDetailChange('copies', Math.max(1, orderDetails.copies - 1))} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus size={18} /></button>
                  <span className="text-xl font-bold w-12 text-center">{orderDetails.copies}</span>
                  <button type="button" onClick={() => handleDetailChange('copies', orderDetails.copies + 1)} className="w-10 h-10 rounded-full bg-olaTosca text-white flex items-center justify-center hover:bg-olaBlue"><Plus size={18} /></button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Halaman 5 jangan dijilid..." className="w-full p-2 border rounded-lg text-sm" />
              </div>

              <div className="mt-6 pt-6 border-t border-dashed flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                <div>
                  <span className="text-sm font-bold text-gray-500 block">Estimasi Total Biaya</span>
                  <span className="text-xs text-gray-400">Harga dapat berubah setelah file dicek admin</span>
                </div>
                <span className="text-3xl font-black text-olaTosca">Rp {hitungTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} /><p className="text-sm">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-green-50 text-green-600 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} />
              <div>
                <p className="font-semibold">Pesanan & Pembayaran Berhasil!</p>
                <p className="text-sm">Admin kami akan segera memproses pesanan Anda.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={loading || uploading || success || paymentPending} className="w-full py-4 bg-gradient-to-r from-olaTosca to-olaBlue text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2">
          {uploading ? 'Mengupload Dokumen...' : loading ? 'Menyiapkan Pembayaran...' : paymentPending ? 'Menunggu Pembayaran...' : 'Bayar Sekarang'}
        </button>

      </form>
    </div>
  )
}