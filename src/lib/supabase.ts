import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      slots: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          max_capacity: number
          created_at: string
        }
      }
      bookings: {
        Row: {
          id: string
          slot_id: string
          user_id: string
          user_email: string
          user_name: string
          created_at: string
        }
        Insert: {
          slot_id: string
          user_id: string
          user_email: string
          user_name: string
        }
      }
      admins: {
        Row: {
          id: string
          email: string
          created_at: string
        }
      }
    }
  }
}
