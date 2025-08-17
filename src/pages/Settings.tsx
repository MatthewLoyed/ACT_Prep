import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  SpeakerHigh, 
  SpeakerSlash, 
  SpeakerLow
} from '@phosphor-icons/react'
import ColorSchemeSwitcher from '../components/ColorSchemeSwitcher'

export default function Settings() {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(50)


  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedMuted = localStorage.getItem('soundMuted')
    const savedVolume = localStorage.getItem('soundVolume')
    
    if (savedMuted !== null) {
      setIsMuted(savedMuted === 'true')
    }
    
    if (savedVolume !== null) {
      setVolume(parseInt(savedVolume))
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('soundMuted', String(isMuted))
    localStorage.setItem('soundVolume', String(volume))
  }, [isMuted, volume])

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <SpeakerSlash className="w-6 h-6" />
    if (volume < 50) return <SpeakerLow className="w-6 h-6" />
    return <SpeakerHigh className="w-6 h-6" />
  }

  const getVolumeColor = () => {
    if (isMuted || volume === 0) return 'text-red-400'
    if (volume < 50) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getVolumeBorderColor = () => {
    if (isMuted || volume === 0) return 'border-red-400'
    if (volume < 30) return 'border-yellow-400'
    if (volume < 70) return 'border-orange-400'
    return 'border-green-400'
  }

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          
          <h1 className="text-4xl font-bold text-white mb-2 text-shadow-lg">
            Settings
          </h1>
          <p className="text-white/80 text-lg">
            Customize your experience
          </p>
        </div>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Sound Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <SpeakerHigh className="w-6 h-6 text-white" weight="fill" />
              <h2 className="text-2xl font-bold text-white">Sound Effects</h2>
            </div>
            
            <div className="space-y-4">
              {/* Mute Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-white/90 text-lg">Mute All Sounds</span>
                <button
                  onClick={handleMuteToggle}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isMuted 
                      ? 'bg-red-500/20 border-2 border-red-400' 
                      : `bg-green-500/20 border-2 ${getVolumeBorderColor()}`
                  }`}
                >
                  {getVolumeIcon()}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Volume</span>
                  <span className={`font-bold ${getVolumeColor()}`}>
                    {isMuted ? 'Muted' : `${volume}%`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Volume Presets */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleVolumeChange(25)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Low
                </button>
                <button
                  onClick={() => handleVolumeChange(50)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Medium
                </button>
                <button
                  onClick={() => handleVolumeChange(75)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  High
                </button>
              </div>
            </div>
          </motion.div>

          {/* Color Scheme Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 text-white text-xl">🎨</div>
              <h2 className="text-2xl font-bold text-white">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/90 text-lg">Color Theme</span>
                <ColorSchemeSwitcher />
              </div>
              
              <p className="text-white/60 text-sm">
                Choose from 9 different color schemes to match your style
              </p>
            </div>
          </motion.div>

          {/* Test Sound Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center"
          >
            <button
              onClick={() => {
                if (!isMuted && volume > 0) {
                  // Play test sound using existing audio files
                  const testAudio = new Audio('/sounds/correct_answer.mp3')
                  testAudio.volume = volume / 100
                  testAudio.play().catch(() => {})
                }
              }}
              disabled={isMuted || volume === 0}
              className="text-[var(--color-text-dark)] font-bold py-3 px-8 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'linear-gradient(45deg, var(--color-accent), var(--color-accent-dark))' }}
            >
              Test Sound
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
