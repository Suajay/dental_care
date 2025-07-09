// Supabase Configuration
import { createClient } from '@supabase/supabase-js'

// Supabase credentials - Replace with your actual Supabase project credentials
const supabaseUrl = 'https://xvnqjodxpmnivtjiefay.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bnFqb2R4cG1uaXZ0amllZmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTc0NjYsImV4cCI6MjA2NzU3MzQ2Nn0.cRDKoVUEIsK9-1MOneO5od4SPFaoT0zbUdvGs_vkjlE'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const auth = {
  // Sign up new user
  signUp: async (email, password, userMetadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata
        }
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign in existing user
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error }
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      return null
    }
  },

  // Get current session
  getCurrentSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      return null
    }
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const database = {
  // Generic select query
  select: async (table, columns = '*', filters = {}) => {
    try {
      let query = supabase.from(table).select(columns)
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Generic insert query
  insert: async (table, data) => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
      return { data: result, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Generic update query
  update: async (table, data, filters = {}) => {
    try {
      let query = supabase.from(table).update(data)
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data: result, error } = await query.select()
      return { data: result, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Generic delete query
  delete: async (table, filters = {}) => {
    try {
      let query = supabase.from(table).delete()
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Error handling utility
export const handleError = (error) => {
  console.error('Supabase Error:', error)
  
  // Common error messages
  const errorMessages = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please check your email and confirm your account.',
    'User already registered': 'An account with this email already exists.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Network error': 'Connection error. Please check your internet connection.'
  }
  
  return errorMessages[error.message] || error.message || 'An unexpected error occurred.'
}

// Initialize auth state listener
export const initAuthListener = () => {
  auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('User signed in:', session.user)
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out')
    }
  })
}