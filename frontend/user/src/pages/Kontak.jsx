/* Contact Page - Compact Split Layout (IG Version) */
import React from 'react'
import { motion } from 'framer-motion'
import { Phone, Instagram, MapPin, Clock, ExternalLink } from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function Kontak() {
  const { config } = useConfig()
  
  // Maps URL Logic
  const addressQuery = encodeURIComponent(config.CONTACT_ADDRESS || "Jakarta, Indonesia")
  // Note: Pake q= untuk query search yang bener di embed maps baru
  const mapUrl = `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <div className="pt-24 pb-10 min-h-screen bg-white flex flex-col justify-center">
      
      <motion.div 
        initial="hidden" 
        animate="show" 
        variants={container}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        
        {/* GRID UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          
          {/* KOLOM KIRI: Info */}
          <div className="flex flex-col justify-center space-y-6">
            
            <motion.div variants={item} className="text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                Hubungi <span className="text-olaBlue">{config.APP_NAME}</span>
              </h1>
              <p className="mt-2 text-gray-500">
                Respon cepat via WA atau DM Instagram. Yuk mampir!
              </p>
            </motion.div>

            {/* Grid 2x2 Kartu Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Phone / WhatsApp */}
              <motion.div variants={item} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-olaBlue/30 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Phone size={18} />
                  </div>
                  <span className="font-bold text-gray-700 text-sm">WhatsApp</span>
                </div>
                <div className="font-mono text-gray-900 font-medium truncate">{config.CONTACT_PHONE}</div>
              </motion.div>

              {/* Instagram (Gantiin Email) */}
              <motion.a 
                href={`https://www.instagram.com/${config.CONTACT_INSTAGRAM}/`}
                target="_blank"
                rel="noreferrer"
                variants={item} 
                className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-lg group-hover:bg-pink-100 transition-colors">
                    <Instagram size={18} />
                  </div>
                  <span className="font-bold text-gray-700 text-sm">Instagram</span>
                </div>
                <div className="text-sm text-gray-900 truncate font-medium text-pink-600">
                  @{config.CONTACT_INSTAGRAM}
                </div>
              </motion.a>

              {/* Address */}
              <motion.div variants={item} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-olaBlue/30 transition-all sm:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <MapPin size={18} />
                  </div>
                  <span className="font-bold text-gray-700 text-sm">Alamat Toko</span>
                </div>
                <p className="text-sm text-gray-600 leading-snug line-clamp-2 hover:line-clamp-none transition-all">
                  {config.CONTACT_ADDRESS}
                </p>
              </motion.div>

              {/* Hours */}
              <motion.div variants={item} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-olaBlue/30 transition-all sm:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Clock size={18} />
                  </div>
                  <span className="font-bold text-gray-700 text-sm">Jam Operasional</span>
                </div>
                <div className="text-sm text-gray-900">{config.CONTACT_HOURS}</div>
              </motion.div>

            </div>
          </div>

          {/* KOLOM KANAN: Map */}
          <motion.div variants={item} className="relative h-64 lg:h-auto min-h-[300px] rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-gray-100">
             <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                src={mapUrl}
                title="Lokasi Toko"
                className="w-full h-full grayscale-[10%] hover:grayscale-0 transition-all duration-500 absolute inset-0"
              ></iframe>
              
              <div className="absolute bottom-4 right-4">
                <a 
                  href={`https://maps.google.com/maps?q=${addressQuery}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-white text-gray-800 px-3 py-1.5 rounded-lg shadow-md font-medium text-xs hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink size={14}/> Buka Maps
                </a>
              </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  )
}