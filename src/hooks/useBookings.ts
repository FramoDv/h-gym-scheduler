import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export interface Booking {
  id: string
  slot_id: string
  user_id: string
  user_email: string
  user_name: string
  created_at: string
  slots: {
    date: string
    start_time: string
    end_time: string
  } | null
}

export function useMyBookings() {
  return useQuery({
    queryKey: ['myBookings'],
    queryFn: async (): Promise<Booking[]> => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('bookings')
        .select('*, slots(date, start_time, end_time)')
        .gte('slots.date', today)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).filter(b => b.slots !== null) as Booking[]
    },
    staleTime: 0,
  })
}

export function useUserBookingForDate(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['userBookingsForDate', dateStr],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('slot_id, slots!inner(date)')
        .eq('slots.date', dateStr)

      if (error) throw error
      return (data ?? []).map(b => b.slot_id)
    },
    staleTime: 30 * 1000,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      slotId: string
      userId: string
      userEmail: string
      userName: string
    }) => {
      const { error } = await supabase.from('bookings').insert({
        slot_id: params.slotId,
        user_id: params.userId,
        user_email: params.userEmail,
        user_name: params.userName,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      queryClient.invalidateQueries({ queryKey: ['userBookingsForDate'] })
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] })
    },
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      queryClient.invalidateQueries({ queryKey: ['userBookingsForDate'] })
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] })
    },
  })
}
