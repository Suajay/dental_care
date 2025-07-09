// Patient Service - Handles all patient-related database operations
import { database, supabase } from './supabase-config.js'

export const patientService = {
  // Get patient profile by user ID
  getPatientProfile: async (userId) => {
    try {
      const { data, error } = await database.select('patients', '*', { user_id: userId })
      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error fetching patient profile:', error)
      throw error
    }
  },

  // Create new patient profile
  createPatientProfile: async (patientData) => {
    try {
      const { data, error } = await database.insert('patients', patientData)
      if (error) throw error
      return data?.[0]
    } catch (error) {
      console.error('Error creating patient profile:', error)
      throw error
    }
  },

  // Update patient profile
  updatePatientProfile: async (userId, updates) => {
    try {
      const { data, error } = await database.update('patients', updates, { user_id: userId })
      if (error) throw error
      return data?.[0]
    } catch (error) {
      console.error('Error updating patient profile:', error)
      throw error
    }
  },

  // Get all patients (for staff dashboard)
  getAllPatients: async () => {
    try {
      const { data, error } = await database.select('patients', '*')
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all patients:', error)
      throw error
    }
  },

  // Search patients
  searchPatients: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching patients:', error)
      throw error
    }
  },

  // Get patient's appointments
  getPatientAppointments: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching patient appointments:', error)
      throw error
    }
  },

  // Get patient's upcoming appointments
  getUpcomingAppointments: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('patient_id', patientId)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error)
      throw error
    }
  },

  // Get patient's past appointments
  getPastAppointments: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('patient_id', patientId)
        .lt('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching past appointments:', error)
      throw error
    }
  }
}