// Appointment Service - Handles all appointment-related database operations
import { database, supabase } from './supabase-config.js'

export const appointmentService = {
  // Book new appointment
  bookAppointment: async (appointmentData) => {
    try {
      const { data, error } = await database.insert('appointments', {
        ...appointmentData,
        status: 'scheduled',
        created_at: new Date().toISOString()
      })
      if (error) throw error
      return data?.[0]
    } catch (error) {
      console.error('Error booking appointment:', error)
      throw error
    }
  },

  // Update appointment
  updateAppointment: async (appointmentId, updates) => {
    try {
      const { data, error } = await database.update('appointments', updates, { id: appointmentId })
      if (error) throw error
      return data?.[0]
    } catch (error) {
      console.error('Error updating appointment:', error)
      throw error
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId) => {
    try {
      const { data, error } = await database.update('appointments', 
        { status: 'cancelled', updated_at: new Date().toISOString() }, 
        { id: appointmentId }
      )
      if (error) throw error
      return data?.[0]
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      throw error
    }
  },

  // Get all appointments (for staff dashboard)
  getAllAppointments: async () => {
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
        .order('appointment_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all appointments:', error)
      throw error
    }
  },

  // Get today's appointments
  getTodaysAppointments: async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

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
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString())
        .order('appointment_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error)
      throw error
    }
  },

  // Get appointments by date range
  getAppointmentsByDateRange: async (startDate, endDate) => {
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
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching appointments by date range:', error)
      throw error
    }
  },

  // Get available time slots for a date
  getAvailableTimeSlots: async (date) => {
    try {
      // Get all appointments for the given date
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', date)
        .neq('status', 'cancelled')
      
      if (error) throw error

      // Define business hours (9 AM to 6 PM)
      const businessHours = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
      ]

      // Filter out booked slots
      const bookedSlots = appointments?.map(apt => apt.appointment_time) || []
      const availableSlots = businessHours.filter(slot => !bookedSlots.includes(slot))

      return availableSlots
    } catch (error) {
      console.error('Error fetching available time slots:', error)
      throw error
    }
  },

  // Get appointment statistics
  getAppointmentStats: async () => {
    try {
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

      // Today's appointments
      const todaysAppointments = await this.getTodaysAppointments()
      
      // This month's appointments
      const { data: monthlyAppointments, error: monthlyError } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', startOfMonth.toISOString())
        .lte('appointment_date', endOfMonth.toISOString())
      
      if (monthlyError) throw monthlyError

      // Pending appointments
      const { data: pendingAppointments, error: pendingError } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'scheduled')
        .gte('appointment_date', new Date().toISOString())
      
      if (pendingError) throw pendingError

      return {
        todaysCount: todaysAppointments.length,
        monthlyCount: monthlyAppointments?.length || 0,
        pendingCount: pendingAppointments?.length || 0
      }
    } catch (error) {
      console.error('Error fetching appointment statistics:', error)
      throw error
    }
  }
}