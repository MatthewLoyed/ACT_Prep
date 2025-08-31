// Authentication utilities for Supabase Auth
import { supabase } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

// Auth context types
export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; requiresConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

// Auth state interface
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

// Sign up function
export async function signUp(email: string, password: string) {
  console.log('🔐 Attempting sign up for:', email)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) {
    console.error('❌ Sign up error:', error)
    return { error }
  }
  
  // Check if email confirmation is required
  if (data.user && !data.session) {
    console.log('✅ Sign up successful - email confirmation required:', data.user.email)
    return { error: null, requiresConfirmation: true }
  }
  
  console.log('✅ Sign up successful - user confirmed immediately:', data.user?.email)
  return { error: null, requiresConfirmation: false }
}

// Sign in function
export async function signIn(email: string, password: string) {
  console.log('🔐 Attempting sign in for:', email)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    console.error('❌ Sign in error:', error)
    return { error }
  }
  
  console.log('✅ Sign in successful:', data.user?.email)
  return { error: null }
}

// Sign out function
export async function signOut() {
  console.log('🔐 Signing out...')
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('❌ Sign out error:', error)
    throw error
  }
  
  console.log('✅ Sign out successful')
}

// Reset password function
export async function resetPassword(email: string) {
  console.log('🔐 Requesting password reset for:', email)
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })
  
  if (error) {
    console.error('❌ Password reset error:', error)
    return { error }
  }
  
  console.log('✅ Password reset email sent')
  return { error: null }
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get current session
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
