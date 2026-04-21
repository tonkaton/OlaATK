import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom' // Tambah useNavigate
import { servicesAPI } from '../services/api'
import Card from '../components/Card'
import Button from '../components/Button'

const getIconName = (iconName) => {
  const iconMap = {
    'printer': 'solar:printer-linear',
    'filetext': 'solar:file-text-linear',
    'file-text': 'solar:file-text-linear',
    'file': 'solar:file-text-linear',
    'copy': 'solar:copy-linear',
    'bookopen': 'solar:book-linear',
    'book-open': 'solar:book-linear',
    'book': 'solar:book-linear',
    'jilid': 'solar:book-linear',
    'layers': 'solar:layers-linear',
    'laminating': 'solar:layers-linear',
    'scan': 'solar:document-add-linear',
    'scanner': 'solar:document-add-linear',
    'palette': 'solar:palette-linear',
    'desain': 'solar:palette-linear',
    'design': 'solar:palette-linear',
    'package': 'solar:box-linear',
    'settings': 'solar:settings-linear',
  }
  
  if (!iconName) return 'solar:printer-linear'
  const normalizedName = iconName.toLowerCase().replace(/\s+/g, '')
  return iconMap[normalizedName] || 'solar:printer-linear'
}

export default function Services() {
  const navigate = useNavigate() // Inisialisasi navigate
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
          allServices = [
            { id: 1, nama: 'Cetak Dokumen', deskripsi: 'Print PDF/Word dari rumah. Tinggal upload, kami antar/jemput.', nama_icon: 'printer' },
            { id: 2, nama: 'Fotokopi', deskripsi: 'Perbanyak dokumen kilat dengan kualitas jernih.', nama_icon: 'copy' },
            { id: 3, nama: 'Jilid Buku', deskripsi: 'Pilihan Softcover, Hardcover, hingga Spiral.', nama_icon: 'book' },
            { id: 4, nama: 'Laminating', deskripsi: 'Perlindungan maksimal untuk dokumen berharga Anda.', nama_icon: 'layers' },
            { id: 5, nama: 'Scan Dokumen', deskripsi: 'Digitalisasi berkas fisik ke format PDF/JPG.', nama_icon: 'scan' },
          ]
        }

        const online = allServices.filter(s => 
          s.nama.toLowerCase().includes('cetak') || s.nama.toLowerCase().includes('print')
        )
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="svg-spinners:ring-resize" className="text-4xl text-dark" />
      </div>
    )
  }

  return (
    <div className="bg-light min-h-screen pt-32 pb-20">
      <div className="max-w-[82rem] mx-auto px-6 md:px-12 lg:px-20">
        
        {/* Header */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="border border-border rounded-full px-4 py-1.5">
              <span className="text-xs uppercase tracking-wider font-medium text-dark">Layanan</span>
            </div>
            <div className="h-[1px] bg-border flex-grow"></div>
          </div>

          <h1 className="font-display text-[2.5rem] md:text-[4.5rem] font-semibold tracking-tighter text-dark leading-[1.1]">
            Solusi Cetak <br className="hidden md:block" /> Untuk Segala Kebutuhan.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-text max-w-2xl font-normal leading-relaxed">
            Dari dokumen kantor hingga tugas kuliah, kami memastikan hasil terbaik dengan proses yang memudahkan Anda.
          </p>
        </div>

        {/* SECTION 1: LAYANAN ONLINE */}
        <div className="mb-28">
          <div className="flex items-end justify-between mb-10 pb-4 border-b border-border/50">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-medium text-dark">Layanan Online</h2>
              <p className="text-neutral-text text-sm mt-1">Proses kilat, tanpa perlu keluar rumah</p>
            </div>
            <Icon icon="solar:cloud-upload-linear" className="text-3xl text-dark/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {onlineServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card 
                  hover 
                  padding="lg" 
                  className="h-full group border-2 border-border hover:border-dark transition-all duration-300 flex flex-col md:flex-row gap-6 items-start"
                >
                  <div className="w-16 h-16 shrink-0 bg-dark rounded-2xl flex items-center justify-center text-white">
                    <Icon icon={getIconName(service.nama_icon)} className="text-3xl" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-display text-2xl font-medium text-dark">{service.nama}</h3>
                      <span className="text-[10px] uppercase tracking-widest bg-dark text-white px-2 py-0.5 rounded">Fast</span>
                    </div>
                    <p className="text-neutral-text leading-relaxed mb-6">
                      {service.deskripsi}
                    </p>
                    <Button
                      onClick={() => navigate('/order')} // FIX: Gunakan onClick navigate
                      variant="primary"
                      icon="solar:arrow-right-linear"
                      className="w-full md:w-auto relative z-20"
                    >
                      Pesan Sekarang
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECTION 2: LAYANAN OFFLINE */}
        <div>
          <div className="flex items-end justify-between mb-10 pb-4 border-b border-border/50">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-medium text-dark">Layanan di Toko</h2>
              <p className="text-neutral-text text-sm mt-1">Layanan walk-in dengan hasil instan</p>
            </div>
            <Icon icon="solar:shop-linear" className="text-3xl text-dark/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offlineServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card 
                  hover 
                  padding="md" 
                  className="h-full group border border-border hover:border-dark transition-all flex flex-col cursor-pointer"
                  onClick={() => navigate('/kontak')} // FIX: Card jadi clickable buat jaga-jaga
                >
                  <div className="w-12 h-12 bg-light-gray rounded-xl flex items-center justify-center text-dark group-hover:bg-dark group-hover:text-white transition-all mb-4">
                    <Icon icon={getIconName(service.nama_icon)} className="text-2xl" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-dark mb-2">{service.nama}</h3>
                  <p className="text-sm text-neutral-text leading-relaxed mb-6 flex-grow">
                    {service.deskripsi}
                  </p>
                  <div className="text-xs font-semibold uppercase tracking-widest text-dark flex items-center gap-2 group-hover:gap-3 transition-all">
                    Cek Lokasi <Icon icon="solar:arrow-right-linear" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FINAL CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-28"
        >
          <div className="border-t border-border pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left">
              <h2 className="font-display text-[1.75rem] font-medium text-dark mb-2">Punya Kebutuhan Khusus?</h2>
              <p className="text-neutral-text text-sm">
                Kami melayani pesanan partai besar dengan harga spesial. Hubungi kami via Instagram untuk konsultasi cepat.
              </p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => window.open('https://ig.me/m/ola.atk.balaraja', '_blank')} // FIX: External link manual
                variant="outline" 
                icon="solar:letter-linear"
                className="relative z-20"
              >
                DM Instagram
              </Button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}