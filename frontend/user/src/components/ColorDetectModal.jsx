import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'

export default function ColorDetectModal({ open, type, colorCount, totalPages, onKeepBw, onSwitchColor, onSwitchCampur, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl border border-border max-w-lg w-full p-8"
          >
            {type === 'warning-bw' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center border border-orange-200">
                  <Icon icon="solar:danger-triangle-bold" className="text-3xl text-orange-500" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-dark text-center mb-2 tracking-tight">
                  Terdeteksi Halaman Berwarna
                </h3>
                <p className="text-neutral-text text-center text-sm mb-6 leading-relaxed">
                  File Anda terdeteksi mengandung <strong className="text-dark">{colorCount}</strong> dari <strong className="text-dark">{totalPages}</strong> halaman berwarna. Anda memilih mode <strong className="text-dark">Hitam Putih</strong>.
                </p>
                <div className="bg-light-gray rounded-xl p-4 border border-border mb-6">
                  <p className="text-xs text-neutral-text font-medium flex items-center gap-2">
                    <Icon icon="solar:info-circle-linear" className="text-base" />
                    Hasil cetak hitam putih dari halaman berwarna mungkin tidak optimal.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={onKeepBw}
                    className="w-full py-3 bg-dark text-white rounded-xl font-semibold hover:bg-dark/90 transition shadow-md"
                  >
                    Ya, tetap cetak Hitam Putih
                  </button>
                  <button
                    onClick={onSwitchColor}
                    className="w-full py-3 border-2 border-border text-dark rounded-xl font-semibold hover:border-dark transition"
                  >
                    Ganti ke Berwarna
                  </button>
                  {colorCount < totalPages && (
                    <button
                      onClick={onSwitchCampur}
                      className="w-full py-3 text-sm text-neutral-text font-medium hover:text-dark transition"
                    >
                      Gunakan mode Campur ({totalPages - colorCount} BW / {colorCount} Warna)
                    </button>
                  )}
                </div>
              </>
            )}

            {type === 'scanning' && (
              <div className="text-center py-4">
                <Icon icon="svg-spinners:ring-resize" className="text-4xl text-dark mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-dark mb-2">Menganalisis Halaman...</h3>
                <p className="text-sm text-neutral-text">Memeriksa setiap halaman untuk mendeteksi warna.</p>
              </div>
            )}

            {type === 'campur-filled' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 bg-olaTosca/10 rounded-full flex items-center justify-center border border-olaTosca/20">
                  <Icon icon="solar:check-circle-bold" className="text-3xl text-olaTosca" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-dark text-center mb-2 tracking-tight">
                  Halaman Terdeteksi
                </h3>
                <p className="text-neutral-text text-center text-sm mb-2">
                  {colorCount > 0
                    ? `${totalPages - colorCount} halaman BW & ${colorCount} halaman berwarna terisi otomatis.`
                    : 'Semua halaman terdeteksi hitam putih.'
                  }
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 w-full py-3 bg-dark text-white rounded-xl font-semibold hover:bg-dark/90 transition shadow-md"
                >
                  Lanjutkan
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
