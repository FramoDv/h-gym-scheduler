import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Dumbbell, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const { session, loading, signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  const handleGoogleSignIn = async () => {
    setSigning(true)
    setError(null)
    const err = await signIn()
    if (err) setError('Errore durante il login. Riprova.')
    setSigning(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">HumansGym</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Prenota il tuo slot in palestra
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Accedi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Usa il tuo account <strong>@humans.tech</strong>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={signing}
            className="w-full gap-2"
            size="lg"
          >
            {signing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Accedi con Google
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Accesso riservato ai dipendenti Humans.tech
          </p>
        </div>
      </div>
    </div>
  )
}
