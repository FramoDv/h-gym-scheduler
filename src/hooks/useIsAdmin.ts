import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useIsAdmin(email: string | undefined) {
  return useQuery({
    queryKey: ['isAdmin', email],
    queryFn: async () => {
      if (!email) return false
      const { data } = await supabase
        .from('admins')
        .select('email')
        .eq('email', email)
        .maybeSingle()
      return !!data
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  })
}
