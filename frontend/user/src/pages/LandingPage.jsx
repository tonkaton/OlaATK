import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom' // Pake navigate buat kepastian
import { useConfig } from '../contexts/ConfigContext'
import { ordersAPI, servicesAPI } from '../services/api'
import MarqueeSection from '../components/MarqueeSection'
import ServiceCard from '../components/ServiceCard'
import Card from '../components/Card'
import Button from '../components/Button'

export default function LandingPage() {
  const { config } = useConfig()
  const navigate = useNavigate() // Inisialisasi navigate
  const [todayOrdersCount, setTodayOrdersCount] = useState(0)
  const [onlineServices, setOnlineServices] = useState([])
  const [offlineServices, setOfflineServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch today's orders count
  useEffect(() => {
    const fetchTodayOrders = async () => {
      try {
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

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.getActive()
        let all = []
        if (response.success && response.data?.dataLayanan) {
          all = response.data.dataLayanan
        } else {
          all = [
            { id: 1, nama: 'Print Dokumen', nama_icon: 'printer', deskripsi: 'Print PDF, Word, Excel dengan kualitas terbaik.' },
            { id: 2, nama: 'Fotokopi', nama_icon: 'copy', deskripsi: 'Fotokopi satuan atau bundel dengan harga terjangkau.' },
            { id: 3, nama: 'Jilid', nama_icon: 'book', deskripsi: 'Jilid spiral, softcover, hardcover.' },
            { id: 4, nama: 'Scan Dokumen', nama_icon: 'scan', deskripsi: 'Scan dokumen fisik menjadi file digital.' }
          ]
        }
        setOnlineServices(all.filter(s => s.nama.toLowerCase().includes('cetak') || s.nama.toLowerCase().includes('print')))
        setOfflineServices(all.filter(s => !s.nama.toLowerCase().includes('cetak') && !s.nama.toLowerCase().includes('print')))
      } catch (e) {
        console.error(e)
      }
    }
    fetchServices()
  }, [])

  const marqueeImages = ['/ola1.webp', '/ola2.webp', '/ola3.webp', '/ola4.webp', '/ola5.webp', '/ola6.webp', '/ola8.webp']

  return (
    <div className="bg-light">
      
      {/* HERO SECTION */}
      <section className="px-6 md:px-12 lg:px-20 pt-32 md:pt-40 pb-20">
        <div className="max-w-[82rem] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col mb-16"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-4">
              <div className="w-32 h-20 md:w-40 md:h-28 rounded-xl overflow-hidden">
                <img src="/logo.jpg" alt="OlaATK" className="w-full h-full object-cover" />
              </div>
              <h1 className="font-display font-semibold text-[3.5rem] md:text-[6rem] leading-[1.1] tracking-tighter text-dark">
                Cetak Cepat,
              </h1>
            </div>
            <h1 className="font-display font-semibold text-[3.5rem] md:text-[6rem] leading-[1.1] tracking-tighter text-dark mt-2 md:mt-0">
              Hasil Rapi.
            </h1>
            <p className="mt-8 text-lg md:text-xl text-neutral-text max-w-2xl font-normal leading-relaxed">
              Layanan printing & fotokopi 24 jam. Pesan online atau datang langsung. 
              Hasil berkualitas, harga terjangkau.
            </p>
          </motion.div>

          <MarqueeSection images={marqueeImages} speed={30} />
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="px-6 md:px-12 lg:px-20 py-20 md:py-28 max-w-[82rem] mx-auto">
        <div className="flex items-center gap-4 mb-14">
          <div className="border border-border rounded-full px-4 py-1.5">
            <span className="text-xs uppercase tracking-wider font-medium text-dark">About</span>
          </div>
          <div className="h-[1px] bg-border flex-grow"></div>
        </div>

        <h2 className="font-display text-[2rem] md:text-[3.5rem] font-medium tracking-tight text-dark leading-[1.2] max-w-5xl mb-20">
          Kami adalah tim yang siap membantu kebutuhan cetak-mencetak Anda kapan saja.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-end">
          <div className="grid grid-cols-2 gap-y-12 gap-x-8 md:gap-x-16">
            <div className="flex flex-col border-l border-border pl-6">
              <span className="font-display text-[3.5rem] md:text-[4.5rem] font-medium text-dark leading-none">24/7</span>
              <span className="text-base text-neutral-text mt-2">Jam Operasional</span>
            </div>
            <div className="flex flex-col border-l border-border pl-6">
              <span className="font-display text-[3.5rem] md:text-[4.5rem] font-medium text-dark leading-none">
                {isLoading ? '...' : `${todayOrdersCount}+`}
              </span>
              <span className="text-base text-neutral-text mt-2">Pesanan Hari Ini</span>
            </div>
          </div>

          <div className="flex justify-start md:justify-end">
            <Button 
              onClick={() => navigate('/services')} // FIX: Pake navigate
              variant="outline"
              icon="solar:arrow-right-linear"
              className="relative z-20" // Anti block
            >
              Lihat Semua Layanan
            </Button>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="px-6 md:px-12 lg:px-20 py-20 max-w-[82rem] mx-auto">
        <div className="flex items-center gap-4 mb-16">
          <div className="border border-border rounded-full px-4 py-1.5">
            <span className="text-xs uppercase tracking-wider font-medium text-dark">Services</span>
          </div>
          <div className="h-[1px] bg-border flex-grow"></div>
        </div>

        <div className="flex flex-col">
          <ServiceCard
            number="01"
            title="Cetak Dokumen"
            description="Print PDF, Word, Excel dengan kualitas terbaik."
            tags={['PDF', 'Word', 'Excel']}
            icon="solar:printer-linear"
            onClick={() => navigate('/order')} // FIX
          />
          <ServiceCard
            number="02"
            title="Fotokopi"
            description="Fotokopi satuan atau bundel hasil jernih."
            tags={['Satuan', 'Bundel']}
            icon="solar:copy-linear"
            onClick={() => navigate('/kontak')} // FIX
          />
          <ServiceCard
            number="03"
            title="Jilid & Laminating"
            description="Jilid spiral, softcover, hardcover."
            tags={['Spiral', 'Hardcover']}
            icon="solar:book-linear"
            onClick={() => navigate('/kontak')} // FIX
          />
          <ServiceCard
            number="04"
            title="Scan Dokumen"
            description="Scan dokumen fisik menjadi file digital."
            tags={['PDF', 'JPG']}
            icon="solar:document-add-linear"
            onClick={() => navigate('/kontak')} // FIX
          />
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 md:px-12 lg:px-20 py-20 max-w-[82rem] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-[2rem] md:text-[3.5rem] font-medium text-dark mb-4">Cara Pemesanan</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* ONLINE CARD */}
          <Card variant="default" padding="lg" hover className="relative overflow-hidden group border-2 border-dark flex flex-col">
            <div className="absolute top-0 right-0 bg-dark/5 w-32 h-32 rounded-bl-full -mr-8 -mt-8 opacity-50 z-0"></div>
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-14 h-14 bg-dark rounded-xl flex items-center justify-center text-white">
                <Icon icon="solar:cloud-upload-linear" className="text-[2rem]" />
              </div>
              <h3 className="font-display text-2xl font-medium text-dark">Layanan Online</h3>
            </div>
            <p className="text-neutral-text mb-8 relative z-10">Upload file Anda sekarang, kami kerjakan, Anda tinggal ambil.</p>
            <Button 
              onClick={() => navigate('/order')} // FIX: Pake navigate
              variant="primary"
              icon="solar:arrow-right-linear"
              className="w-full mt-auto relative z-20" // Anti block
            >
              Buat Pesanan Online
            </Button>
          </Card>

          {/* OFFLINE CARD */}
          <Card variant="ghost" padding="lg" hover className="relative overflow-hidden group border border-border flex flex-col">
            <div className="absolute top-0 right-0 bg-dark/5 w-32 h-32 rounded-bl-full -mr-8 -mt-8 opacity-50 z-0"></div>
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-14 h-14 bg-light-gray border border-border rounded-xl flex items-center justify-center text-dark">
                <Icon icon="solar:map-point-linear" className="text-[2rem]" />
              </div>
              <h3 className="font-display text-2xl font-medium text-dark">Datang ke Toko</h3>
            </div>
            <p className="text-neutral-text mb-8 relative z-10">Datang langsung ke lokasi kami untuk layanan kilat.</p>
            <Button 
              onClick={() => navigate('/kontak')} // FIX: Pake navigate
              variant="outline"
              icon="solar:map-point-linear"
              className="w-full mt-auto relative z-20" // Anti block
            >
              Lihat Lokasi di Peta
            </Button>
          </Card>
        </div>
      </section>
    </div>
  )
}