import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ActiveSpace {
  id: string
  name: string
  description: string | null
  max_capacity: number
  available_days: number[]
  allow_multiple_bookings: boolean
}

export function useActiveSpaces() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('spaces-config-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' }, () => {
        queryClient.invalidateQueries({ queryKey: ['spaces'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return useQuery({
    queryKey: ['spaces', 'active'],
    queryFn: async (): Promise<ActiveSpace[]> => {
      const { data } = await supabase
        .from('spaces')
        .select('id, name, description, max_capacity, available_days, allow_multiple_bookings')
        .eq('is_active', true)
        .order('created_at')
      return (data ?? []) as ActiveSpace[]
    },
    staleTime: 60 * 1000,
  })
}
