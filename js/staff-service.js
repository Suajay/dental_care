// Staff Service - Handles staff-related operations and dashboard functionality
import { database, supabase } from './supabase-config.js'

export const staffService = {
  // Get staff profile by user ID
  getStaffProfile: async (userId) => {
    try {
      const { data, error } = await database.select('staff', '*', { user_id: userId })
      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error fetching staff profile:', error)
      throw error
    }
  },

  // Create new staff profile
  createStaffProfile: async (staffData) => {
    try {
      const { data, error } = await database.insert('staff', staffData)
      if (error) throw error
      return data?.[0]
    } catch (error) {
      console.error('Error creating staff profile:', error)
      throw error
    }
  },

  // Update staff profile
  updateStaffProfile: async (userId, updates) => {
    try {
      const { data, error } = await database.update('staff', updates, { user_id: userId })
      if (error) throw error
      return data?.[0]
    } catch (error) {
      console.error('Error updating staff profile:', error)
      throw error
    }
  },

  // Get all staff members
  getAllStaff: async () => {
    try {
      const { data, error } = await database.select('staff', '*')
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all staff:', error)
      throw error
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

      // Today's appointments count
      const { data: todaysAppointments, error: todayError } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', today.toISOString().split('T')[0])
        .lt('appointment_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      
      if (todayError) throw todayError

      // Active patients count
      const { data: activePatients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'active')
      
      if (patientsError) throw patientsError

      // Pending treatments count
      const { data: pendingTreatments, error: treatmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'scheduled')
        .gte('appointment_date', new Date().toISOString())
      
      if (treatmentsError) throw treatmentsError

      // Monthly revenue (mock calculation)
      const { data: monthlyAppointments, error: revenueError } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', startOfMonth.toISOString())
        .lte('appointment_date', endOfMonth.toISOString())
        .eq('status', 'completed')
      
      if (revenueError) throw revenueError

      // Mock revenue calculation (in real app, this would come from payments table)
      const mockRevenue = (monthlyAppointments?.length || 0) * 150

      return {
        todaysAppointments: todaysAppointments?.length || 0,
        activePatients: activePatients?.length || 0,
        pendingTreatments: pendingTreatments?.length || 0,
        monthlyRevenue: mockRevenue
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error)
      throw error
    }
  },

  // Get recent activity
  getRecentActivity: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            email
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      throw error
    }
  },

  // Generate reports
  generateReport: async (reportType, dateRange) => {
    try {
      const { startDate, endDate } = dateRange
      
      switch (reportType) {
        case 'appointments':
          return await this.getAppointmentReport(startDate, endDate)
        case 'patients':
          return await this.getPatientReport(startDate, endDate)
        case 'revenue':
          return await this.getRevenueReport(startDate, endDate)
        default:
          throw new Error('Invalid report type')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      throw error
    }
  },

  // Get appointment report
  getAppointmentReport: async (startDate, endDate) => {
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
      console.error('Error fetching appointment report:', error)
      throw error
    }
  },

  // Get patient report
  getPatientReport: async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching patient report:', error)
      throw error
    }
  },

  // Get revenue report (mock)
  getRevenueReport: async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            email
          )
        `)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: true })
      
      if (error) throw error
      
      // Mock revenue calculation
      const appointmentsWithRevenue = (data || []).map(appointment => ({
        ...appointment,
        revenue: 150 // Mock revenue per appointment
      }))
      
      return appointmentsWithRevenue
    } catch (error) {
      console.error('Error fetching revenue report:', error)
      throw error
    }
  }
}