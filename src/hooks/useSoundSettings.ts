import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface SoundSettings {
  isMuted: boolean
  volume: number
}

export function useSoundSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<SoundSettings>({
    isMuted: false,
    volume: 50
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from Supabase
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
        console.error('Error loading sound settings:', error)
        return
      }
      
      if (data) {

        setSettings({
          isMuted: data.sound_muted ?? false,
          volume: data.sound_volume ?? 50
        })
      } else {
        console.log('🔊 No sound settings found for user, using defaults')
      }
    } catch (error) {
      console.error('Error loading sound settings:', error)
    } finally {
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadSettings()
    } else {
      // Reset to defaults if no user
      setSettings({ isMuted: false, volume: 50 })
      setIsLoaded(true)
    }
  }, [user?.id]) // Reload when user changes

  // No periodic refresh - we'll refresh manually when needed

  // Function to play audio with user settings applied
  const playAudio = (audio: HTMLAudioElement) => {
    // Don't play if settings haven't loaded yet or if muted/volume is 0
    if (!isLoaded || settings.isMuted || settings.volume === 0) {
      console.log('🔊 Sound settings:', { isLoaded, isMuted: settings.isMuted, volume: settings.volume })
      return // Don't play if settings not loaded or muted
    }
    

    
    // Apply volume setting (convert from 0-100 to 0-1)
    audio.volume = settings.volume / 100
    
    // Reset and play
    try {
      audio.currentTime = 0
      audio.play().catch(() => {})
    } catch {
      // Ignore errors
    }
  }

  // Function to refresh settings (useful for testing)
  const refreshSettings = () => {
    setIsLoaded(false)
    loadSettings()
  }

  return {
    settings,
    isLoaded,
    playAudio,
    refreshSettings
  }
}
