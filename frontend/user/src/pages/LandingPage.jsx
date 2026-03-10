/* Energetic Landing with Split Online/Offline Services */
import React, { useState, useEffect } from 'react'
import { Printer, FileText, Copy, BookOpen, Layers, Scan, Palette, Package, Settings, UploadCloud, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useConfig } from '../contexts/ConfigContext'
import { ordersAPI, servicesAPI } from '../services/api'

// --- ANIMATION VARIANTS ---
const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, when: 'beforeChildren' } }
}
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

// --- ICONS MAPPING ---
const iconMap = {
  'printer': Printer, 'filetext': FileText, 'file-text': FileText, 'file': FileText,
  'copy': Copy, 'bookopen': BookOpen, 'book-open': BookOpen, 'book': BookOpen,
  'jilid': BookOpen, 'layers': Layers, 'laminating': Layers, 'scan': Scan,
  'scanner': Scan, 'palette': Palette, 'desain': Palette, 'design': Palette,
  'package': Package, 'settings': Settings,
}

const getIconComponent = (iconName) => {
  if (!iconName) return Printer
  const normalizedName = iconName.toLowerCase().replace(/\s+/g, '')
  return iconMap[normalizedName] || Printer
}

export default function LandingPage() {
  const { config } = useConfig()
  const [todayOrdersCount, setTodayOrdersCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTodayOrders = async () => {
      try {
        // [FIX FINAL] HARDCODE 'ONLINE'
        // Ini kuncinya biar pesanan Offline Admin GAK KEHITUNG disini.
        const response = await ordersAPI.getTodayCount('ONLINE')
        
        if (response.success) {
          setTodayOrdersCount(response.data.count || 0)
        } else {
          setTodayOrdersCount(0)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setTodayOrdersCount(0)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTodayOrders()
  }, [])

  return (
    <div className="pt-24"> 
      
      {/* --- HERO SECTION --- */}
      <motion.section initial="hidden" animate="show" variants={heroVariants} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center gap-12">
        <motion.div variants={item} className="flex-1">
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-olaLight text-olaBlue text-sm font-medium mb-4">
            <Printer className="w-5 h-5" /> Layanan Cepat & Terpercaya
          </div>
          <motion.h1 variants={item} className="text-4xl md:text-5xl font-extrabold leading-tight text-olaBlue">
            Solusi Cetak & ATK Tanpa Ribet di <span className="text-gray-800">{config.APP_NAME}</span>
          </motion.h1>
          <motion.p variants={item} className="mt-6 text-gray-600 max-w-xl text-lg">
            Mau cetak tugas jam 2 pagi atau fotokopi modul tebal? Kami siap bantu. Pesan online tinggal upload, atau datang langsung ke toko.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex gap-3">
            <Link to="/order" className="px-8 py-3 rounded-xl bg-gradient-to-r from-olaTosca to-olaBlue text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition flex items-center gap-2">
              <UploadCloud size={20}/> Pesan Online
            </Link>
            <Link to="/kontak" className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-olaBlue hover:text-olaBlue transition flex items-center gap-2">
              <MapPin size={20}/> Lokasi Toko
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex items-center gap-8 border-t pt-6">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Proses Kilat</div>
              <div className="font-bold text-gray-800 text-xl">30–60 Menit</div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Antrian Masuk Hari Ini</div>
              <div className="font-bold text-olaTosca text-xl">
                {isLoading ? '...' : `${todayOrdersCount} Pesanan`}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={item} className="flex-1 w-full max-w-md">
          <div className="relative bg-gradient-to-br from-white to-olaLight rounded-[2.5rem] p-8 shadow-2xl border border-white/50">
            <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              Buka Sekarang
            </div>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="flex flex-col items-center gap-6 py-8">
              <div className="w-40 h-40 rounded-3xl bg-white flex items-center justify-center shadow-lg border border-gray-100">
                <Printer className="w-20 h-20 text-olaBlue" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-xl text-gray-800">Cetak Dokumen Online</h3>
                <p className="text-sm text-gray-500 mt-2 px-4">Upload PDF/Word kamu, bayar, lalu ambil atau kami antar.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* --- SERVICES SECTION (SPLIT VIEW) --- */}
      <ServicesPreview />

      {/* --- FOOTER --- */}
      <footer id="contact" className="border-t mt-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="font-bold text-xl text-olaBlue">{config.APP_NAME}</div>
            <div className="text-sm text-gray-500 mt-2 max-w-xs">{config.CONTACT_ADDRESS}</div>
            <div className="text-sm font-medium text-gray-600 mt-1">{config.CONTACT_HOURS}</div>
          </div>
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} {config.APP_NAME} — Digital Printing Solution.
          </div>
        </div>
      </footer>
    </div>
  )
}

function ServicesPreview() {
  const [onlineServices, setOnlineServices] = useState([])
  const [offlineServices, setOfflineServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.getActive()
        let all = []
        if (response.success && response.data?.dataLayanan) {
          all = response.data.dataLayanan
        } else {
          // Fallback kalau API mati/kosong
          all = [
            { id: 1, nama: 'Cetak Dokumen', nama_icon: 'printer', deskripsi: 'Print A4/F4' },
            { id: 2, nama: 'Fotokopi', nama_icon: 'copy', deskripsi: 'Perbanyak dokumen' },
            { id: 3, nama: 'Jilid', nama_icon: 'book', deskripsi: 'Softcover/Hardcover' },
            { id: 4, nama: 'Scan', nama_icon: 'scan', deskripsi: 'Scan ke PDF' }
          ]
        }
        
        // Split Logic: Cetak/Print masuk Online, sisanya Offline
        setOnlineServices(all.filter(s => s.nama.toLowerCase().includes('cetak') || s.nama.toLowerCase().includes('print')))
        setOfflineServices(all.filter(s => !s.nama.toLowerCase().includes('cetak') && !s.nama.toLowerCase().includes('print')))
      } catch (e) {
        console.error(e)
      } finally { setLoading(false) }
    }
    fetchServices()
  }, [])

  if (loading) return null

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-extrabold text-gray-900">Cara Pemesanan</h2>
        <p className="text-gray-500 mt-3 text-lg">Pilih metode yang paling nyaman buat kamu</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        
        {/* ONLINE CARD */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 border-2 border-green-100 shadow-xl shadow-green-100/50 hover:border-green-300 transition-all flex flex-col relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 bg-green-100 w-32 h-32 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                    <UploadCloud size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">Layanan Online</h3>
                    <p className="text-green-600 font-medium text-sm">Cukup dari rumah</p>
                </div>
            </div>

            <p className="text-gray-600 mb-6">Upload file kamu sekarang, kami kerjakan, kamu tinggal ambil atau kami antar.</p>
            
            <div className="space-y-3 mb-8 flex-1">
                {onlineServices.map(s => (
                    <div key={s.id} className="flex items-center gap-3 text-gray-700">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <span className="font-medium">{s.nama}</span>
                    </div>
                ))}
                <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Pembayaran Mudah</span>
                </div>
            </div>

            <Link to="/order" className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-center hover:bg-green-700 transition flex items-center justify-center gap-2 group-hover:shadow-lg">
                Buat Pesanan Online <ArrowRight size={20}/>
            </Link>
        </motion.div>

        {/* OFFLINE CARD */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            className="bg-gray-50 rounded-3xl p-8 border border-gray-200 hover:bg-white hover:shadow-xl hover:border-orange-200 transition-all flex flex-col relative overflow-hidden group"
        >
             <div className="absolute top-0 right-0 bg-orange-100 w-32 h-32 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                    <MapPin size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">Datang ke Toko</h3>
                    <p className="text-orange-600 font-medium text-sm">Walk-in Service</p>
                </div>
            </div>

            <p className="text-gray-600 mb-6">Datang langsung ke lokasi kami untuk layanan fotokopi, scan, dan jilid kilat.</p>

            <div className="space-y-3 mb-8 flex-1">
                {offlineServices.map(s => (
                    <div key={s.id} className="flex items-center gap-3 text-gray-600">
                         <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span>{s.nama}</span>
                    </div>
                ))}
                 <div className="flex items-center gap-3 text-gray-600">
                     <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    <span>Konsultasi Desain</span>
                </div>
            </div>

            <Link to="/kontak" className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-center hover:border-orange-400 hover:text-orange-600 transition flex items-center justify-center gap-2">
                Lihat Lokasi di Peta <MapPin size={20}/>
            </Link>
        </motion.div>

      </div>
    </section>
  )
}