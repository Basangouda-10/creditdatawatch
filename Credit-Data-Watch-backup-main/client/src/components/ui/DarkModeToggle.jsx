
import { useState, useEffect } from 'react'

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = saved ? JSON.parse(saved) : prefersDark
    setIsDark(initialDark)
    if (initialDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('darkMode', JSON.stringify(newDark))
    if (newDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-indigo-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <span className="text-xl">☀️</span>
      ) : (
        <span className="text-xl">🌙</span>
      )}
    </button>
  )
}

export default DarkModeToggle
