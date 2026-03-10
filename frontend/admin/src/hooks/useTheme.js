import { useState, useEffect } from 'react'
import { APP_CONFIG } from '../config/constants'

export default function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('ola_theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    localStorage.setItem('ola_theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, setDark, toggleTheme: () => setDark(!dark) }
}
