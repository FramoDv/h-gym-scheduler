import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export interface SlotWithCount {
  id: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  min_capacity: number
  is_cancelled: boolean
  booking_count: number
}

export function useSlots(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['slots', dateStr],
    queryFn: async (): Promise<SlotWithCount[]> => {
      const { data: slots, error } = await supabase
        .from('slots')
        .select('id, date, start_time, end_time, max_capacity, min_capacity, is_cancelled')
        .eq('date', dateStr)
        .order('start_time')

      if (error) throw error
      if (!slots) return []

      // Fetch booking counts for each slot
      const slotIds = slots.map(s => s.id)
      const { data: bookings, error: bError } = await supabase
        .from('bookings')
        .select('slot_id')
        .in('slot_id', slotIds)

      if (bError) throw bError

      const countMap: Record<string, number> = {}
      for (const b of bookings ?? []) {
        countMap[b.slot_id] = (countMap[b.slot_id] ?? 0) + 1
      }

      return slots.map(s => ({
        ...s,
        booking_count: countMap[s.id] ?? 0,
      }))
    },
    staleTime: 30 * 1000,
  })
}
