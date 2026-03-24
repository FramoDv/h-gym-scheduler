import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type AccessState = 'checking' | 'allowed' | 'denied'

async function checkWhitelist(email: string): Promise<boolean> {
  const domain = email.split('@')[1] ?? ''

  const [{ data: domainMatch }, { data: emailMatch }] = await Promise.all([
    supabase.from('allowed_domains').select('id').eq('domain', domain).limit(1),
    supabase.from('allowed_emails').select('id').eq('email', email).limit(1),
  ])

  return (domainMatch?.length ?? 0) > 0 || (emailMatch?.length ?? 0) > 0
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useAuth()
  const [access, setAccess] = useState<AccessState>('checking')

  useEffect(() => {
    if (loading) return
    if (!session) {
      setAccess('allowed') // will redirect to login anyway
      return
    }

    const email = session.user.email ?? ''
    checkWhitelist(email).then(allowed => {
      if (allowed) {
        setAccess('allowed')
      } else {
        setAccess('denied')
        signOut()
      }
    })
  }, [session, loading, signOut])

  if (loading || (session && access === 'checking')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (access === 'denied') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold">Accesso non autorizzato</p>
        <p className="text-muted-foreground text-sm">
          Il tuo account non è abilitato per accedere a questa applicazione.
        </p>
        <Navigate to="/login" replace />
      </div>
    )
  }

  return <>{children}</>
}
