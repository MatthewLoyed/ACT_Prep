import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import EngagingLoader from './EngagingLoader'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Verification failed. Please try again.')
          return
        }

        // Handle the auth callback
        const { data, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          setStatus('error')
          setMessage('Verification failed. Please try again.')
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('Email verified successfully! Redirecting...')
          
          // Redirect to practice page after a short delay
          setTimeout(() => {
            navigate('/practice')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Verification failed. Please try again.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An unexpected error occurred.')
      }
    }

    handleAuthCallback()
  }, [navigate])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <EngagingLoader message={message} size="lg" />
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-4 text-white">Success!</h1>
          <p className="text-secondary mb-6">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-4 text-white">Verification Failed</h1>
        <p className="text-secondary mb-6">{message}</p>
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}
