/* Order page with Mixed Color Logic (Smart Calculation) */
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { servicesAPI, ordersAPI, uploadAPI, authAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Printer, Book, Copy, Layers, UploadCloud, FileText, CheckCircle, AlertCircle, Plus, Minus, Calculator } from 'lucide-react'

export default function Order() {
  const { isAuthenticated, user } = useAuth()
  const fileInputRef = useRef(null)

  // --- STATE DATA DIRI ---
  const [contactForm, setContactForm] = useState({ name: '', phone: '', alamat: '' })

  // --- STATE LOGIC PEMESANAN ---
  const [selectedService, setSelectedService] = useState(null)

  const [orderDetails, setOrderDetails] = useState({
    paperSize: 'A4',
    colorMode: 'Hitam Putih', // Default
    copies: 1, // Jumlah Rangkap (Bundel)
    bindingType: 'Tidak Ada',

    // Logic Baru: Halaman Spesifik
    bwPages: 0,   // Jumlah halaman B/W per bundel
    colorPages: 0 // Jumlah halaman Warna per bundel
  })

  const [note, setNote] = useState('')
  // --- STATE FILE ---
  const [file, setFile] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState(null)
  const [fileError, setFileError] = useState('')

  // --- STATE SYSTEM ---
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loadingServices, setLoadingServices] = useState(true)

  // 1. Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && user?.userId && user?.userType === 'user') {
        try {
          const response = await authAPI.getPelangganByUserId(user.userId)
          if (response.success && response.data?.pelanggan) {
            const { nama_lengkap, nomor_telepon, alamat } = response.data.pelanggan
            setContactForm({
              name: nama_lengkap || '',
              phone: nomor_telepon || '',
              alamat: alamat || ''
            })
          }
        } catch (err) { console.error(err) }
      }
    }
    fetchUserData()
  }, [isAuthenticated, user])

  // 2. Fetch Services (Filter Cetak)
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.getActive()
        if (response.success && response.data?.dataLayanan) {
          const onlineServices = response.data.dataLayanan.filter(service =>
            service.nama.toLowerCase().includes('cetak') ||
            service.nama.toLowerCase().includes('print')
          )
          setServices(onlineServices)
          if(onlineServices.length > 0) setSelectedService(onlineServices[0])
        }
      } catch (err) {
        setServices([{ id: 1, nama: 'Cetak Dokumen', nama_icon: 'printer' }])
      } finally { setLoadingServices(false) }
    }
    fetchServices()
  }, [])

  // --- HANDLERS ---
  const handleContactChange = (e) => {
    setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleServiceSelect = (service) => {
    setSelectedService(service)
    if (!service.nama.toLowerCase().includes('cetak')) {
      setFile(null); setUploadedFileName(null);
    }
  }

  const handleDetailChange = (key, value) => {
    setOrderDetails(prev => ({ ...prev, [key]: value }))
  }

  const handleFile = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if(selectedFile.size > 20 * 1024 * 1024) { // Naik jadi 20MB biar aman pdf gede
        setFileError('Ukuran file maksimal 20MB')
        return
      }
      setFile(selectedFile)
      setUploadedFileName(null)
      setFileError('')
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

  // --- LOGIC OTAK BARU (SMART ITEMS GENERATOR) ---
  const generateOrderItems = () => {
    const items = []
    const sName = selectedService?.nama || ''
    const copies = parseInt(orderDetails.copies) || 1

    if (sName.toLowerCase().includes('cetak') || sName.toLowerCase().includes('print')) {

      // LOGIC 1: MODE CAMPUR (MIXED)
      if (orderDetails.colorMode === 'Campur') {
        // Item B/W
        if (orderDetails.bwPages > 0) {
          items.push({
            nama_barang: `Cetak ${orderDetails.paperSize} (Hitam Putih)`,
            harga_satuan: 0,
            jumlah: parseInt(orderDetails.bwPages) * copies // Halaman x Rangkap
          })
        }
        // Item Warna
        if (orderDetails.colorPages > 0) {
          items.push({
            nama_barang: `Cetak ${orderDetails.paperSize} (Berwarna)`,
            harga_satuan: 0,
            jumlah: parseInt(orderDetails.colorPages) * copies // Halaman x Rangkap
          })
        }
      }
      // LOGIC 2: MODE FULL (BIASA)
      else {
        // Disini kita asumsikan input 'copies' adalah TOTAL LEMBAR kalau mode simple
        // ATAU kita anggap user ngeprint 1 file full.
        // Biar konsisten, kita pakai logic: User input jumlah lembar total.
        items.push({
          nama_barang: `Cetak ${orderDetails.paperSize} (${orderDetails.colorMode})`,
          harga_satuan: 0,
          jumlah: copies // Di mode simple, copies = total lembar yg mau diprint
        })
      }

      // Add-on Jilid (Dihitung per bundel/rangkap)
      if (orderDetails.bindingType !== 'Tidak Ada') {
        items.push({
          nama_barang: `Jilid ${orderDetails.bindingType}`,
          harga_satuan: 0,
          // PERBAIKAN: Berapapun rangkapnya, jilidnya ngikutin. Ga ada lagi logika campur = copies, biasa = 1.
          jumlah: copies
        })
      }
    }
    // Logic Jilid Langsung (Tanpa Cetak)
    else if (sName.toLowerCase().includes('jilid')) {
      items.push({
        nama_barang: `Jilid ${orderDetails.bindingType}`,
        harga_satuan: 0,
        jumlah: copies
      })
    }
    // Default
    else {
      items.push({
        nama_barang: sName,
        harga_satuan: 0,
        jumlah: copies
      })
    }

    return items
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!contactForm.name || !contactForm.phone || !contactForm.alamat) {
      setError('Data diri wajib diisi semua')
      return
    }

    const isPrintService = selectedService?.nama.toLowerCase().includes('cetak')

    if (isPrintService && !file && !uploadedFileName) {
      setError('Mohon upload dokumen yang ingin dicetak')
      return
    }

    // Validasi Logic Campur
    if (isPrintService && orderDetails.colorMode === 'Campur') {
        if (orderDetails.bwPages <= 0 && orderDetails.colorPages <= 0) {
            setError('Mohon isi jumlah halaman Hitam Putih atau Berwarna')
            return
        }
    }

    try {
      setLoading(true)
      let finalFileName = uploadedFileName
      if (file && !uploadedFileName) {
        try {
            finalFileName = await uploadFile()
        } catch(uErr) {
            setError('Gagal upload file. Cek koneksi internet.')
            setLoading(false)
            return
        }
      }

      const itemsPayload = generateOrderItems()

      const payload = {
        nama_lengkap: contactForm.name,
        nomor_telepon: contactForm.phone,
        alamat: contactForm.alamat,
        jenis_layanan: selectedService.nama,
        mode_pesanan: 'ONLINE',
        nama_file: finalFileName || null,
        items: itemsPayload,
        catatan_pesanan: note || null,
        nilai_pesanan: 0
      }

      const response = await ordersAPI.createPublic(payload)
      if (response.success) {
        setSuccess(true)
        window.scrollTo(0, 0)
        setTimeout(() => setSuccess(false), 5000)

        if(!user) setContactForm({ name:'', phone:'', alamat:'' })
        setFile(null); setUploadedFileName(null);
        setNote('')
        setOrderDetails({ paperSize:'A4', colorMode:'Hitam Putih', copies:1, bindingType:'Tidak Ada', isLaminating:false, bwPages: 0, colorPages: 0 })
      } else {
        setError(response.message || 'Gagal membuat pesanan')
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconName) => {
    switch(iconName?.toLowerCase()) {
      case 'printer': return <Printer size={24}/>;
      case 'book': return <Book size={24}/>;
      case 'copy': return <Copy size={24}/>;
      case 'layers': return <Layers size={24}/>;
      default: return <FileText size={24}/>;
    }
  }

  if (loadingServices) return <div className="text-center py-20">Memuat Layanan...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      <div className="text-left mb-10 mt-6">
        <h1 className="text-3xl font-bold text-gray-800">Buat Pesanan Baru</h1>
        <p className="text-gray-500 mt-2">Pilih layanan, upload file, dan duduk manis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. DATA PEMESAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="bg-olaTosca text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
            Data Pemesan
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input name="name" value={contactForm.name} onChange={handleContactChange}
                disabled={user?.userType === 'user' && contactForm.name}
                className="w-full mt-1 p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-olaTosca outline-none" placeholder="Budi Santoso" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">WhatsApp</label>
              <input name="phone" value={contactForm.phone} onChange={handleContactChange}
                 disabled={user?.userType === 'user' && contactForm.phone}
                className="w-full mt-1 p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-olaTosca outline-none" placeholder="08xxxxxxxx" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Alamat Pengiriman / Jemput</label>
              <textarea name="alamat" value={contactForm.alamat} onChange={handleContactChange}
                 disabled={user?.userType === 'user' && contactForm.alamat}
                className="w-full mt-1 p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-olaTosca outline-none" rows="2" placeholder="Jl. Mawar No. 12..." />
            </div>
          </div>
        </div>

        {/* 2. PILIH LAYANAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="bg-olaTosca text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            Pilih Layanan
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map(srv => (
              <div
                key={srv.id}
                onClick={() => handleServiceSelect(srv)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 h-32
                  ${selectedService?.id === srv.id
                    ? 'border-olaTosca bg-olaTosca/5 text-olaTosca'
                    : 'border-gray-100 hover:border-olaTosca/50 text-gray-600'}`}
              >
                {getIcon(srv.nama_icon)}
                <span className="text-sm font-medium">{srv.nama}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. DETAIL PESANAN */}
        {selectedService && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="bg-olaTosca text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
              Detail {selectedService.nama}
            </h2>
            <div className="space-y-6">

              {/* === KHUSUS CETAK DOKUMEN === */}
              {selectedService.nama.toLowerCase().includes('cetak') && (
                <>
                  {/* File Upload */}
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-olaTosca'}`}>
                    <input type="file" id="fileUpload" onChange={handleFile} className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" />
                    <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                      {file ? (
                         <>
                          <CheckCircle className="text-green-500 mb-2" size={32} />
                          <span className="text-green-700 font-medium truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-green-600 mt-1">Klik untuk ganti file</span>
                         </>
                      ) : (
                        <>
                          <UploadCloud className="text-gray-400 mb-2" size={32} />
                          <span className="text-gray-600 font-medium">Klik untuk Upload Dokumen</span>
                          <span className="text-xs text-gray-400 mt-1">PDF, Word, atau Gambar (Max 20MB)</span>
                        </>
                      )}
                    </label>
                    {fileError && <p className="text-red-500 text-xs mt-2">{fileError}</p>}
                  </div>

                  {/* Kertas & Warna */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran Kertas</label>
                      <div className="flex bg-gray-11 rounded-lg">
                        {['A4', 'F4 (Folio)'].map(size => (
                          <button key={size} type="button"
                            onClick={() => handleDetailChange('paperSize', size.split(' ')[0])}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${orderDetails.paperSize === size.split(' ')[0] ? 'bg-white shadow text-olaTosca' : 'text-gray-500'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mode Warna</label>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['Hitam Putih', 'Berwarna', 'Campur'].map(mode => (
                          <button key={mode} type="button"
                            onClick={() => handleDetailChange('colorMode', mode)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${orderDetails.colorMode === mode ? 'bg-white shadow text-olaTosca' : 'text-gray-500'}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* LOGIC KHUSUS: INPUT DETAIL HALAMAN JIKA CAMPUR */}
                  {orderDetails.colorMode === 'Campur' && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                        <div className="flex items-center gap-2 mb-3 text-orange-800 font-medium">
                            <Calculator size={18}/> Detail Halaman (Per 1 File/Buku)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Jml Halaman Hitam Putih</label>
                                <input
                                    type="number" min="0"
                                    value={orderDetails.bwPages}
                                    onChange={(e) => handleDetailChange('bwPages', e.target.value)}
                                    className="w-full p-2 rounded border border-gray-300 focus:ring-olaTosca focus:border-olaTosca"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Jml Halaman Berwarna</label>
                                <input
                                    type="number" min="0"
                                    value={orderDetails.colorPages}
                                    onChange={(e) => handleDetailChange('colorPages', e.target.value)}
                                    className="w-full p-2 rounded border border-gray-300 focus:ring-olaTosca focus:border-olaTosca"
                                />
                            </div>
                        </div>
                    </motion.div>
                  )}

                  {/* Jilid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jilid Sekalian?</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {['Tidak Ada', 'Lakban Biasa', 'Softcover', 'Hardcover'].map(type => (
                         <div key={type}
                          onClick={() => handleDetailChange('bindingType', type)}
                          className={`cursor-pointer px-3 py-2 border rounded-lg text-sm text-center ${orderDetails.bindingType === type ? 'border-olaTosca bg-olaTosca/10 text-olaTosca' : 'border-gray-200 text-gray-600'}`}
                         >
                           {type}
                         </div>
                       ))}
                    </div>
                  </div>
                </>
              )}

              {/* === KHUSUS JILID SAJA === */}
              {selectedService.nama.toLowerCase().includes('jilid') && (
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Jilid</label>
                   <select
                    value={orderDetails.bindingType}
                    onChange={(e) => handleDetailChange('bindingType', e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                   >
                     <option value="Lakban Biasa">Lakban Biasa</option>
                     <option value="Softcover">Softcover (Jilid Buku)</option>
                     <option value="Hardcover">Hardcover (Skripsi)</option>
                     <option value="Spiral">Jilid Spiral Kawat</option>
                   </select>
                </div>
              )}

              {/* === JUMLAH COUNTER (RANGKAP/BUNDEL) === */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {/* Logic Text Label */}
                  {orderDetails.colorMode === 'Campur'
                       ? 'Mau dicetak berapa rangkap (bundel)?'
                       : selectedService.nama.includes('Jilid') ? 'Jumlah Buku/Bundel' : 'Jumlah Lembar / Copy'}
                </label>
                <div className="flex items-center gap-4">
                  <button type="button"
                    onClick={() => handleDetailChange('copies', Math.max(1, orderDetails.copies - 1))}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    <Minus size={18}/>
                  </button>
                  <span className="text-xl font-bold w-12 text-center">{orderDetails.copies}</span>
                  <button type="button"
                    onClick={() => handleDetailChange('copies', orderDetails.copies + 1)}
                    className="w-10 h-10 rounded-full bg-olaTosca text-white flex items-center justify-center hover:bg-olaBlue"
                  >
                    <Plus size={18}/>
                  </button>
                </div>
                {orderDetails.colorMode === 'Campur' && (
                    <p className="text-xs text-gray-500 mt-2">
                        Total: {(parseInt(orderDetails.bwPages || 0) + parseInt(orderDetails.colorPages || 0)) * orderDetails.copies} Halaman akan dicetak.
                    </p>
                )}
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Halaman 5 jangan dijilid..."
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ALERTS & BUTTON */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-green-50 text-green-600 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} />
              <div>
                 <p className="font-semibold">Pesanan Berhasil Dikirim!</p>
                 <p className="text-sm">Admin kami akan segera menghitung total harga.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || uploading || success}
          className="w-full py-4 bg-gradient-to-r from-olaTosca to-olaBlue text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? 'Sedang Memproses...' : uploading ? 'Mengupload Dokumen...' : 'Kirim Pesanan Sekarang'}
        </button>
      </form>
    </div>
  )
}