// Signup page component
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import EngagingLoader from '../components/EngagingLoader'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const { signUp, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await signUp(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Don't redirect immediately - user needs to verify email
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/practice`
        }
      })
      
      if (error) {
        setError(error.message)
        setIsSubmitting(false)
      }
      // Don't set loading to false here - user will be redirected
    } catch (err) {
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EngagingLoader message="Loading..." size="lg" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen py-16 relative overflow-hidden">
        {/* Background gradient matching the site */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"></div>
        
        {/* Floating brains background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => {
            const startX = Math.random() * 100
            const startY = Math.random() * 100
            
            return (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0.2,
                  scale: 0.4
                }}
                animate={{
                  x: [0, 200, 400, 200, 0],
                  y: [0, 150, 300, 150, 0],
                  opacity: [0.2, 0.4, 0.2],
                  scale: [0.4, 0.6, 0.4],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 25 + Math.random() * 15,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${startX}%`,
                  top: `${startY}%`
                }}
              >
                <img 
                  src="/images/yellowBrain.png" 
                  alt="Floating Brain" 
                  className="w-6 h-6 opacity-20"
                />
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center max-w-md w-full border-0"
          >
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold mb-4 text-white">
                Check Your Email!
              </h1>
              <p className="text-secondary mb-6">
                We've sent you a verification link. Click the link in your email to complete your registration.
              </p>
              <div className="alert alert-success bg-green-500/20 border-green-500/30 text-green-200 mb-6">
                <span>Account created successfully!</span>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign In
              </Link>
            </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16 relative overflow-hidden">
      {/* Background gradient matching the site */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"></div>
      
      {/* Floating brains background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const startX = Math.random() * 100
          const startY = Math.random() * 100
          
          return (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: 0,
                y: 0,
                opacity: 0.2,
                scale: 0.4
              }}
              animate={{
                x: [0, 200, 400, 200, 0],
                y: [0, 150, 300, 150, 0],
                opacity: [0.2, 0.4, 0.2],
                scale: [0.4, 0.6, 0.4],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 25 + Math.random() * 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                left: `${startX}%`,
                top: `${startY}%`
              }}
            >
              <img 
                src="/images/yellowBrain.png" 
                alt="Floating Brain" 
                className="w-6 h-6 opacity-20"
              />
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl max-w-md w-full border-0"
        >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src="/images/yellowBrain.png" 
                  alt="Brain Logo" 
                  className="w-16 h-16 mr-3"
                  style={{
                    filter: 'var(--logo-filter, hue-rotate(0deg) saturate(0.8) brightness(1.1))'
                  }}
                />
                <h1 className="text-3xl font-bold text-white">
                  Sign Up
                </h1>
              </div>
              <p className="text-secondary text-lg">
                Start your FREE ACT® Prep Journey Today!
              </p>
            </div>

                         {/* Form */}
             <form onSubmit={handleSubmit} className="space-y-6">
                               {/* Email */}
                <div className="relative">
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium mb-2 text-white"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 px-4 py-3 rounded-lg focus:border-[var(--color-accent)] focus:bg-white/20 focus:outline-none transition-all duration-200"
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                               {/* Password */}
                <div className="relative">
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium mb-2 text-white"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 px-4 py-3 rounded-lg focus:border-[var(--color-accent)] focus:bg-white/20 focus:outline-none transition-all duration-200"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-secondary mt-1">Must be at least 6 characters</p>
                </div>

               

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="alert alert-error bg-red-500/20 border-red-500/30 text-red-200"
                >
                  <span>{error}</span>
                </motion.div>
              )}

                                                           {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-2"
                >
                  {isSubmitting ? (
                    <EngagingLoader message="Creating account..." size="sm" />
                  ) : (
                    'Create Account!'
                  )}
                </button>

                                                              {/* Divider */}
                  <div className="relative my-4">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-white/20"></div>
                 </div>
                 <div className="relative flex justify-center text-sm">
                   <span className="px-4 bg-transparent text-white relative z-10">or</span>
                 </div>
               </div>

                             {/* Google Sign Up Button */}
               <button
                 type="button"
                 onClick={handleGoogleSignUp}
                 disabled={isSubmitting}
                                   className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all duration-200"
               >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                                 Sign up with Google
              </button>
            </form>

                         {/* Links */}
             <div className="mt-8 text-center">
               <div className="text-white">
                 Already have an account?{' '}
                 <Link
                   to="/login"
                   className="text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors underline"
                 >
                   Sign in
                 </Link>
               </div>
             </div>

            {/* Back to Home */}
            <div className="mt-8 text-center">
                             <Link
                 to="/"
                 className="inline-flex items-center text-white hover:text-white transition-colors"
               >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </motion.div>
      </motion.div>
    </div>
  )
}
