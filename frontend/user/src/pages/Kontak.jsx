import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useConfig } from '../contexts/ConfigContext'
import Card from '../components/Card'
import Button from '../components/Button'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export default function Kontak() {
  const { config } = useConfig()
  
  // WhatsApp Fallback Logic
  const waNumber = config.CONTACT_WA || "+62 852-1638-8303"
  
  const addressQuery = encodeURIComponent(config.CONTACT_ADDRESS || "Jakarta, Indonesia")
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${addressQuery}`
  // Fallback embed jika API Key tidak ada (pake mode search standar)
  const embedUrl = `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  const formatWhatsApp = (wa) => {
    if (!wa) return ''
    const cleaned = wa.replace(/\D/g, '')
    return cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned
  }

  return (
    <div className="min-h-screen bg-light pt-32 pb-20">
      
      <motion.div 
        initial="hidden" 
        animate="show" 
        variants={container}
        className="max-w-[82rem] mx-auto px-6 md:px-12 lg:px-20"
      >
        
        {/* HEADER */}
        <motion.div variants={item} className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="border border-border rounded-full px-4 py-1.5">
              <span className="text-xs uppercase tracking-wider font-medium text-dark">Contact Us</span>
            </div>
            <div className="h-[1px] bg-border flex-grow"></div>
          </div>

          <h1 className="font-display text-[2.5rem] md:text-[4.5rem] font-semibold tracking-tighter text-dark leading-[1.1]">
            Hubungi Kami.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-text max-w-2xl font-normal leading-relaxed">
            Butuh bantuan cetak kilat atau konsultasi desain? Tim kami siap merespon via kanal di bawah ini.
          </p>
        </motion.div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* LEFT: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* WhatsApp Card */}
            <motion.a
              href={`https://wa.me/${formatWhatsApp(waNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              variants={item}
              className="block"
            >
              <Card hover padding="lg" className="group cursor-pointer border-2 border-transparent hover:border-dark transition-all duration-500">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 shrink-0 bg-light-gray rounded-2xl flex items-center justify-center text-dark group-hover:bg-dark group-hover:text-white transition-all duration-500 shadow-sm">
                    <Icon icon="solar:phone-bold" className="text-2xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display text-xl font-medium text-dark tracking-tight">WhatsApp</h3>
                      <div className="w-8 h-8 rounded-full bg-light-gray flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                        <Icon icon="solar:arrow-right-up-linear" className="text-dark" />
                      </div>
                    </div>
                    <p className="text-neutral-text text-sm mb-3">Respon cepat untuk order & info harga</p>
                    <span className="font-mono text-dark font-semibold text-sm bg-light-gray px-3 py-1.5 rounded-lg border border-border/40">
                      {waNumber}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.a>

            {/* Instagram Card */}
            {config.CONTACT_INSTAGRAM && (
              <motion.a
                href={`https://www.instagram.com/${config.CONTACT_INSTAGRAM}/`}
                target="_blank"
                rel="noopener noreferrer"
                variants={item}
                className="block"
              >
                <Card hover padding="lg" className="group cursor-pointer border-2 border-transparent hover:border-dark transition-all duration-500">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 shrink-0 bg-light-gray rounded-2xl flex items-center justify-center text-dark group-hover:bg-dark group-hover:text-white transition-all duration-500 shadow-sm">
                      <Icon icon="solar:instagram-bold" className="text-2xl" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-display text-xl font-medium text-dark tracking-tight">Instagram</h3>
                        <div className="w-8 h-8 rounded-full bg-light-gray flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                          <Icon icon="solar:arrow-right-up-linear" className="text-dark" />
                        </div>
                      </div>
                      <p className="text-neutral-text text-sm mb-3">Update promo & hasil pengerjaan</p>
                      <span className="font-mono text-dark font-semibold text-sm bg-light-gray px-3 py-1.5 rounded-lg border border-border/40">
                        @{config.CONTACT_INSTAGRAM}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.a>
            )}

            {/* Hours Card */}
            <motion.div variants={item}>
              <Card padding="lg" className="border border-border bg-white">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 shrink-0 bg-light-gray rounded-2xl flex items-center justify-center text-dark">
                    <Icon icon="solar:clock-circle-bold" className="text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-medium text-dark tracking-tight mb-2">Jam Operasional</h3>
                    <p className="text-neutral-text text-sm leading-relaxed font-medium">
                      {config.CONTACT_HOURS || 'Layanan Tersedia 24 Jam'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT: Map Section */}
          <motion.div variants={item} className="lg:col-span-7 flex flex-col gap-6">
            <div className="relative group">
              {/* Address Overlay - MORE PREMIUM */}
              <div className="absolute top-6 left-6 right-6 z-20 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md border border-white p-6 rounded-2xl shadow-xl max-w-sm flex flex-col gap-4 pointer-events-auto transition-all duration-500 group-hover:-translate-y-1">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-dark">
                      <Icon icon="solar:map-point-bold" className="text-xl" />
                      <span className="font-display font-bold uppercase tracking-widest text-xs">Lokasi Toko</span>
                    </div>
                    <p className="text-dark font-medium text-sm leading-relaxed">
                      {config.CONTACT_ADDRESS || 'Balaraja, Tangerang, Banten'}
                    </p>
                  </div>
                  <Button
                    as="a"
                    href={`https://www.google.com/maps/search/?api=1&query=${addressQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    size="sm"
                    className="w-full font-bold tracking-wide"
                  >
                    Petunjuk Jalan
                  </Button>
                </div>
              </div>

              {/* MONOCHROME MAP */}
              <div className="relative h-[500px] lg:h-[600px] rounded-[2rem] overflow-hidden border border-border shadow-inner bg-neutral-200">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  src={embedUrl}
                  title="Ola ATK Location"
                  style={{ filter: 'grayscale(100%) contrast(1.2) brightness(0.9) invert(0.05)' }}
                  className="w-full h-full transition-all duration-1000 group-hover:filter-none opacity-80 group-hover:opacity-100"
                ></iframe>
                
                {/* Bottom Bar Hint */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-dark text-white text-[10px] uppercase tracking-[0.2em] px-6 py-2.5 rounded-full font-bold shadow-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                  Interactive Map Mode
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  )
}