import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminBooking } from '@/pages/Admin'

export function useAdminBookings(from: string, spaceId?: string) {
  return useQuery({
    queryKey: ['adminBookings', from, spaceId],
    queryFn: async (): Promise<AdminBooking[]> => {
      let query = supabase
        .from('bookings')
        .select('*, slots!inner(date, start_time, end_time, space_id, spaces(name))')
        .gte('created_at', from)
        .order('created_at', { ascending: false })

      if (spaceId) {
        query = query.eq('slots.space_id', spaceId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []).filter(b => b.slots !== null) as AdminBooking[]
    },
    staleTime: 30 * 1000,
  })
}
