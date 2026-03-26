import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session, user: session?.user ?? null, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, user: session?.user ?? null, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    return error
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  const signInWithMagicLink = async (email: string) => {
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    return error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { ...state, signIn, signInWithEmail, signInWithMagicLink, signOut }
}
