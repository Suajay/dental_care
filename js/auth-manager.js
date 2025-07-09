// Authentication Manager - Handles authentication flows and user management
import { auth, handleError } from './supabase-config.js'
import { patientService } from './patient-service.js'
import { staffService } from './staff-service.js'

export const authManager = {
  // Initialize authentication
  init: async () => {
    try {
      const session = await auth.getCurrentSession()
      if (session) {
        await this.handleAuthenticatedUser(session.user)
      }
      
      // Listen for auth changes
      auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await this.handleAuthenticatedUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut()
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
    }
  },

  // Handle patient login
  patientLogin: async (email, password) => {
    try {
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        throw new Error(handleError(error))
      }
      
      if (data.user) {
        // Check if user has patient profile
        const patientProfile = await patientService.getPatientProfile(data.user.id)
        
        if (!patientProfile) {
          // Create patient profile if it doesn't exist
          await patientService.createPatientProfile({
            user_id: data.user.id,
            email: data.user.email,
            first_name: data.user.user_metadata?.first_name || '',
            last_name: data.user.user_metadata?.last_name || '',
            phone: data.user.user_metadata?.phone || '',
            status: 'active',
            created_at: new Date().toISOString()
          })
        }
        
        return { success: true, user: data.user, profile: patientProfile }
      }
      
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Handle patient registration
  patientRegister: async (email, password, userData) => {
    try {
      const { data, error } = await auth.signUp(email, password, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        user_type: 'patient'
      })
      
      if (error) {
        throw new Error(handleError(error))
      }
      
      if (data.user) {
        // Create patient profile
        const patientProfile = await patientService.createPatientProfile({
          user_id: data.user.id,
          email: email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          date_of_birth: userData.dateOfBirth,
          address: userData.address,
          emergency_contact: userData.emergencyContact,
          insurance_info: userData.insuranceInfo,
          status: 'active',
          created_at: new Date().toISOString()
        })
        
        return { success: true, user: data.user, profile: patientProfile }
      }
      
      return { success: false, error: 'Registration failed' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Handle staff login
  staffLogin: async (email, password) => {
    try {
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        throw new Error(handleError(error))
      }
      
      if (data.user) {
        // Check if user has staff profile
        const staffProfile = await staffService.getStaffProfile(data.user.id)
        
        if (!staffProfile) {
          throw new Error('Access denied. Staff credentials required.')
        }
        
        return { success: true, user: data.user, profile: staffProfile }
      }
      
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Handle logout
  logout: async () => {
    try {
      const { error } = await auth.signOut()
      if (error) {
        throw new Error(handleError(error))
      }
      
      this.handleSignOut()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Handle authenticated user
  handleAuthenticatedUser: async (user) => {
    try {
      // Store user info in localStorage for easy access
      localStorage.setItem('currentUser', JSON.stringify(user))
      
      // Check user type and redirect accordingly
      const userType = user.user_metadata?.user_type
      
      if (userType === 'staff') {
        const staffProfile = await staffService.getStaffProfile(user.id)
        if (staffProfile) {
          localStorage.setItem('staffProfile', JSON.stringify(staffProfile))
        }
      } else {
        const patientProfile = await patientService.getPatientProfile(user.id)
        if (patientProfile) {
          localStorage.setItem('patientProfile', JSON.stringify(patientProfile))
        }
      }
      
      // Dispatch custom event for other parts of the app
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user, authenticated: true } 
      }))
      
    } catch (error) {
      console.error('Error handling authenticated user:', error)
    }
  },

  // Handle sign out
  handleSignOut: () => {
    // Clear localStorage
    localStorage.removeItem('currentUser')
    localStorage.removeItem('patientProfile')
    localStorage.removeItem('staffProfile')
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { user: null, authenticated: false } 
    }))
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('currentUser')
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Get patient profile from localStorage
  getPatientProfile: () => {
    try {
      const profile = localStorage.getItem('patientProfile')
      return profile ? JSON.parse(profile) : null
    } catch (error) {
      console.error('Error getting patient profile:', error)
      return null
    }
  },

  // Get staff profile from localStorage
  getStaffProfile: () => {
    try {
      const profile = localStorage.getItem('staffProfile')
      return profile ? JSON.parse(profile) : null
    } catch (error) {
      console.error('Error getting staff profile:', error)
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!this.getCurrentUser()
  },

  // Check if user is staff
  isStaff: () => {
    const user = this.getCurrentUser()
    return user?.user_metadata?.user_type === 'staff'
  },

  // Check if user is patient
  isPatient: () => {
    const user = this.getCurrentUser()
    return user?.user_metadata?.user_type === 'patient' || !user?.user_metadata?.user_type
  }
}