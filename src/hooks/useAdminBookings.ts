import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminBooking } from '@/pages/Admin'

export function useAdminBookings(from: string) {
  return useQuery({
    queryKey: ['adminBookings', from],
    queryFn: async (): Promise<AdminBooking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, slots!inner(date, start_time, end_time, spaces(name))')
        .gte('created_at', from)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as AdminBooking[]
    },
    staleTime: 30 * 1000,
  })
}
