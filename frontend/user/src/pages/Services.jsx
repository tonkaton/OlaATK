/* Services page with Clear Separation (Online vs Offline) - Left Align Header */
import React, { useState, useEffect } from 'react'
import { FileText, Copy, BookOpen, Layers, Scan, Palette, Printer, Package, Settings, MapPin, UploadCloud } from 'lucide-react'
import { motion } from 'framer-motion'
import { servicesAPI } from '../services/api'
import { Link } from 'react-router-dom'

// Icon mapping
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

export default function Services() {
  const [onlineServices, setOnlineServices] = useState([])
  const [offlineServices, setOfflineServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.getActive()
        let allServices = []
        
        if (response.success && response.data?.dataLayanan) {
          allServices = response.data.dataLayanan
        } else {
          // Fallback data
          allServices = [
            { id: 1, nama: 'Cetak Dokumen', deskripsi: 'Print PDF/Word dari rumah. Tinggal upload, kami antar/jemput.', nama_icon: 'printer' },
            { id: 2, nama: 'Fotokopi', deskripsi: 'Perbanyak dokumen kilat.', nama_icon: 'copy' },
            { id: 3, nama: 'Jilid Buku', deskripsi: 'Softcover, Hardcover, Spiral.', nama_icon: 'book' },
            { id: 4, nama: 'Laminating', deskripsi: 'Pelindung dokumen penting.', nama_icon: 'layers' },
            { id: 5, nama: 'Scan Dokumen', deskripsi: 'Digitalisasi berkas fisik.', nama_icon: 'scan' },
          ]
        }

        // --- PEMISAHAN LOGIC ---
        // Online: Yang namanya mengandung "Cetak" atau "Print"
        const online = allServices.filter(s => 
          s.nama.toLowerCase().includes('cetak') || s.nama.toLowerCase().includes('print')
        )
        // Offline: Sisanya
        const offline = allServices.filter(s => 
          !s.nama.toLowerCase().includes('cetak') && !s.nama.toLowerCase().includes('print')
        )

        setOnlineServices(online)
        setOfflineServices(offline)

      } catch (error) {
        console.error('Failed to fetch services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-500">Memuat katalog layanan...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="text-left mb-12 mt-6">
        <h1 className="text-3xl font-bold text-gray-800">Layanan Ola ATK</h1>
        <p className="text-gray-500 mt-2">Pilih cara pemesanan sesuai kebutuhan Anda</p>
      </div>

      {/* --- SECTION 1: LAYANAN ONLINE --- */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
                <UploadCloud className="text-green-600" size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Layanan Online</h2>
                <p className="text-sm text-gray-500">Upload file dari mana saja, ambil saat jadi.</p>
            </div>
        </div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {onlineServices.map((service, i) => {
            const IconComponent = getIconComponent(service.nama_icon)
            return (
              <motion.div 
                key={service.id} 
                variants={{ hidden:{opacity:0,y:10}, show:{opacity:1,y:0,transition:{delay:i*0.1}} }}
                whileHover={{ y: -5 }}
                className="p-6 bg-white border-2 border-green-100 rounded-2xl hover:shadow-lg hover:border-green-300 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                        <IconComponent className="w-8 h-8 text-green-600" />
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Bisa Online</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{service.nama}</h3>
                <p className="text-gray-500 text-sm mb-6 min-h-[40px]">{service.deskripsi || 'Cetak dokumen tanpa antri.'}</p>
                
                <Link to="/order" className="block w-full py-2 bg-green-600 text-white text-center rounded-lg font-medium hover:bg-green-700 transition-colors">
                  Pesan Sekarang →
                </Link>
              </motion.div>
            )
          })}
          {onlineServices.length === 0 && <p className="text-gray-400 italic">Tidak ada layanan online aktif saat ini.</p>}
        </motion.div>
      </div>

      {/* --- SECTION 2: LAYANAN OFFLINE (WALK-IN) --- */}
      <div>
         <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 p-2 rounded-lg">
                <MapPin className="text-orange-600" size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Layanan di Toko (Walk-in)</h2>
                <p className="text-sm text-gray-500">Silakan datang langsung ke toko untuk layanan ini.</p>
            </div>
        </div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {offlineServices.map((service, i) => {
            const IconComponent = getIconComponent(service.nama_icon)
            return (
              <motion.div 
                key={service.id} 
                variants={{ hidden:{opacity:0,y:10}, show:{opacity:1,y:0,transition:{delay:i*0.1}} }}
                className="p-5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-2 bg-white border shadow-sm rounded-lg">
                        <IconComponent className="w-6 h-6 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-700">{service.nama}</h3>
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.deskripsi}</p>
                <Link to="/kontak" className="text-sm text-orange-600 font-medium hover:underline flex items-center gap-1">
                  <MapPin size={14}/> Lihat Lokasi Toko
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

    </div>
  )
}