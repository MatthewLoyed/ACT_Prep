import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  SpeakerHigh, 
  SpeakerSlash, 
  SpeakerLow
} from '@phosphor-icons/react'
import ColorSchemeSwitcher from '../components/ColorSchemeSwitcher'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'


export default function Settings() {
  const { user } = useAuth()
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(50)
  const [tempVolume, setTempVolume] = useState(50) // Temporary volume during dragging
  const [isSaving, setIsSaving] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  



  // Load settings from Supabase on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('sound_muted, sound_volume')
          .eq('user_id', user?.id) // Only load settings for current user
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (error) {
          console.error('Error loading settings:', error)
          return
        }
        
        if (data) {
          if (data.sound_muted !== null) {
            setIsMuted(data.sound_muted)
          }
          if (data.sound_volume !== null) {
            setVolume(data.sound_volume)
            setTempVolume(data.sound_volume) // Initialize temp volume
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setIsLoaded(true)
      }
    }
    
    loadSettings()
  }, [])

  // Save settings to Supabase when they change (only after initial load)
  useEffect(() => {
    if (!isLoaded) return // Don't save until we've loaded initial settings
    
    const saveSettings = async () => {
      setIsSaving(true)
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user?.id, // Associate with the current user
            sound_muted: isMuted,
            sound_volume: volume,
            created_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Error saving settings:', error)
        }
      } catch (error) {
        console.error('Error saving settings:', error)
      } finally {
        setIsSaving(false)
      }
    }
    
    saveSettings()
  }, [isMuted, volume, isLoaded, user?.id])

  const handleVolumeChange = (newVolume: number) => {
    setTempVolume(newVolume) // Only update temp volume during dragging
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const handleVolumeChangeEnd = (newVolume: number) => {
    setVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
    
    // Play sound feedback only when user releases the slider (like Windows)
    if (newVolume > 0 && !isMuted) {
      const testAudio = new Audio('/sounds/correct_answer.mp3')
      testAudio.volume = newVolume / 100
      testAudio.currentTime = 0
      testAudio.play().catch(() => {})
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
    if (isMuted || tempVolume === 0) return 'text-red-400'
    if (tempVolume < 50) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getVolumeBorderColor = () => {
    if (isMuted || tempVolume === 0) return 'border-red-400'
    if (tempVolume < 30) return 'border-yellow-400'
    if (tempVolume < 70) return 'border-orange-400'
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
          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Account Info</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/90 text-lg">Email:</span>
                <span className="text-white font-semibold">{user?.email || 'Not signed in'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/90 text-lg">Provider:</span>
                <span className="text-white font-semibold">{user?.app_metadata?.provider || 'N/A'}</span>
              </div>
            </div>
          </motion.div>

          {/* Sound Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
                         <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                 <SpeakerHigh className="w-6 h-6 text-white" weight="fill" />
                 <h2 className="text-2xl font-bold text-white">Sound Effects</h2>
               </div>
               {isSaving && (
                 <div className="flex items-center gap-2 text-green-400 text-sm">
                   <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                   Saving...
                 </div>
               )}
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
                    {isMuted ? 'Muted' : `${tempVolume}%`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : tempVolume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    onMouseUp={(e) => handleVolumeChangeEnd(parseInt(e.currentTarget.value))}
                    onTouchEnd={(e) => handleVolumeChangeEnd(parseInt(e.currentTarget.value))}
                    className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${isMuted ? 0 : tempVolume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : tempVolume}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
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

                                           
        </div>
      </motion.div>
    </div>
  )
}
