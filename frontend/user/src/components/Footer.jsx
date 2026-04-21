import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useConfig } from '../contexts/ConfigContext'

export default function Footer() {
  const { config } = useConfig()
  const currentYear = new Date().getFullYear()

  // Auto-format WhatsApp number (remove non-digits, add country code if needed)
  const formatWhatsApp = (wa) => {
    if (!wa) return ''
    const cleaned = wa.replace(/\D/g, '') // remove non-digits
    return cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned
  }

  // Fallback WA sesuai logic Kontak.jsx
  const waNumber = config.CONTACT_WA || "+62 852-1638-8303"

  // Ekstrak huruf pertama buat diganti logo (Asumsi nama brand "OLA ATK")
  const brandName = config.APP_NAME || "OLA ATK"
  const firstLetter = brandName.charAt(0)
  const restOfName = brandName.slice(1)

  return (
    <footer className="bg-dark text-white pt-20 pb-8 px-6 md:px-12 lg:px-20 overflow-hidden">
      <div className="max-w-[82rem] mx-auto flex flex-col">
        
        {/* CTA Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-12">
          
          {/* Left CTA */}
          <div className="flex flex-col gap-6 max-w-lg">
            <h2 className="font-display text-[2rem] md:text-[2.5rem] font-medium tracking-tight leading-snug text-white">
              Butuh cetak dokumen cepat? Kami siap bantu.
            </h2>
            <Link 
              to="/order"
              className="inline-flex items-center gap-2 border border-white/30 text-white rounded-full py-3 px-8 hover:bg-white hover:text-dark transition-all duration-300 w-max group shadow-sm"
            >
              <span className="text-sm font-semibold tracking-wide uppercase">Pesan Sekarang</span>
              <Icon 
                icon="solar:arrow-right-up-linear" 
                className="text-xl transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" 
              />
            </Link>
          </div>
          
          {/* Right: Contact Info & Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 lg:gap-20 w-full lg:w-auto">
            
            {/* Contact Details */}
            <div className="flex flex-col gap-5">
              <h4 className="font-display text-lg font-medium text-white/90">Informasi Kontak</h4>
              <div className="flex flex-col gap-4 text-sm text-white/70">
                
                {/* WhatsApp */}
                <a 
                  href={`https://wa.me/${formatWhatsApp(waNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-start gap-3 group"
                >
                  <Icon icon="solar:phone-bold" className="text-lg mt-0.5 group-hover:scale-110 transition-transform" />
                  <span>
                    <span className="block font-medium text-white/90 mb-0.5">WhatsApp</span>
                    {waNumber}
                  </span>
                </a>

                {/* Instagram */}
                {config.CONTACT_INSTAGRAM && (
                  <a 
                    href={`https://www.instagram.com/${config.CONTACT_INSTAGRAM}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-start gap-3 group"
                  >
                    <Icon icon="solar:instagram-bold" className="text-lg mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>
                      <span className="block font-medium text-white/90 mb-0.5">Instagram</span>
                      @{config.CONTACT_INSTAGRAM}
                    </span>
                  </a>
                )}

                {/* Email */}
                {config.CONTACT_EMAIL && (
                  <a 
                    href={`mailto:${config.CONTACT_EMAIL}`}
                    className="hover:text-white transition-colors flex items-start gap-3 group"
                  >
                    <Icon icon="solar:letter-bold" className="text-lg mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>
                      <span className="block font-medium text-white/90 mb-0.5">Email</span>
                      {config.CONTACT_EMAIL}
                    </span>
                  </a>
                )}

                {/* Address */}
                {config.CONTACT_ADDRESS && (
                  <div className="flex items-start gap-3">
                    <Icon icon="solar:map-point-bold" className="text-lg mt-0.5 shrink-0" />
                    <span className="leading-relaxed max-w-[200px]">
                      <span className="block font-medium text-white/90 mb-0.5">Lokasi</span>
                      {config.CONTACT_ADDRESS}
                    </span>
                  </div>
                )}

                {/* Hours */}
                {config.CONTACT_HOURS && (
                  <div className="mt-2 border-t border-white/10 pt-4 flex items-start gap-3">
                    <Icon icon="solar:clock-circle-bold" className="text-lg mt-0.5 shrink-0" />
                    <span>
                      <strong className="block font-medium text-white/90 mb-0.5">Jam Operasional</strong>
                      {config.CONTACT_HOURS}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-col gap-5">
              <h4 className="font-display text-lg font-medium text-white/90">Navigasi</h4>
              <div className="flex flex-col gap-3 text-sm text-white/70">
                {['Beranda', 'Layanan', 'Pemesanan', 'Kontak'].map((item) => (
                  <Link 
                    key={item}
                    to={item === 'Beranda' ? '/' : `/${item.toLowerCase()}`} 
                    className="hover:text-white transition-colors flex items-center gap-2 group w-max"
                  >
                    <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <Icon icon="solar:alt-arrow-right-linear" />
                    </span>
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Big Brand Name with Logo Image Injection */}
        <div className="text-center w-full mt-6 flex items-center justify-center">
          <h1 className="font-display font-medium text-[15vw] md:text-[14vw] tracking-tighter leading-none text-white flex items-center justify-center">
            {/* LOGO IMAGE REPLACING THE FIRST LETTER 'O' */}
            <img 
              src="/logo2.jpg" 
              alt={firstLetter}
              className="h-[0.8em] w-auto object-contain mix-blend-screen brightness-[1.5] contrast-125 inline-block mr-1 md:mr-2"
              onError={(e) => {
                // Fallback jika logo2.jpg gagal di-load, kembali ke huruf 'O'
                e.target.style.display = 'none';
                e.target.insertAdjacentText('afterend', firstLetter);
              }}
            />
            {/* THE REST OF THE BRAND NAME */}
            <span>{restOfName}</span>
          </h1>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/10 my-8"></div>

        {/* Copyright & Bottom Links */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/50 font-medium tracking-wide">
          <div>© {currentYear} {brandName}. Hak Cipta Dilindungi.</div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/services" className="hover:text-white transition-colors">Layanan</Link>
            <Link to="/order" className="hover:text-white transition-colors">Order Online</Link>
            <Link to="/kontak" className="hover:text-white transition-colors">Lokasi Toko</Link>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Kembali ke Atas <Icon icon="solar:double-alt-arrow-up-linear" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}