import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Palette } from '@phosphor-icons/react'
import { applyColorScheme, getCurrentColorScheme, colorSchemes } from '../lib/colorSchemes'

export default function ColorSchemeSwitcher() {
  const [currentScheme, setCurrentScheme] = useState<keyof typeof colorSchemes>('originalPurpleVanilla')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get current scheme on mount
    setCurrentScheme(getCurrentColorScheme())
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSchemeChange = (schemeName: keyof typeof colorSchemes) => {
    applyColorScheme(schemeName)
    setCurrentScheme(schemeName)
    setIsOpen(false)
    
    // Save preference to localStorage
    localStorage.setItem('preferredColorScheme', schemeName)
  }

  const schemeNames = {
    originalPurpleVanilla: 'Original Purple + Vanilla',
    purpleVanilla: 'Purple + Vanilla (Refined)',
    blueOrange: 'Blue + Orange',
    greenYellow: 'Green + Yellow',
    purplePink: 'Purple + Pink',
    tealCoral: 'Teal + Coral',
    indigoAmber: 'Indigo + Amber',
    roseLime: 'Rose + Lime',
    slateGold: 'Slate + Gold'
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/20 hover:bg-white/15 transition-all"
      >
        <Palette className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Theme: {schemeNames[currentScheme]}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to prevent interaction with elements behind */}
          <div className="fixed inset-0 z-[99998]" onClick={() => setIsOpen(false)} />
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-2 min-w-[200px] z-[99999] shadow-2xl"
          >
             <div className="space-y-1">
               {Object.entries(schemeNames).map(([key, name]) => (
                 <button
                   key={key}
                   onClick={() => handleSchemeChange(key as keyof typeof colorSchemes)}
                   className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                     currentScheme === key
                       ? 'bg-white/20 text-white font-medium'
                       : 'text-white/80 hover:bg-white/10 hover:text-white'
                   }`}
                 >
                   {name}
                 </button>
               ))}
             </div>
           </motion.div>
         </>
       )}
    </div>
  )
}
