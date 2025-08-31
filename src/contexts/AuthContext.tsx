// Authentication context provider
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { signUp, signIn, resetPassword, type AuthContextType } from '../lib/auth'

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Custom sign out that handles missing sessions
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
        // If session is missing, manually clear the auth state
        if (error.message?.includes('session missing')) {
          console.log('ℹ️ Session already expired or missing - manually clearing auth state')
          setSession(null)
          setUser(null)
          return
        }
        throw error
      }
      
      console.log('✅ Sign out successful')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // For any other errors, manually clear the auth state
      setSession(null)
      setUser(null)
    }
  }

  // Auth methods
  const authMethods: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut: handleSignOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={authMethods}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
