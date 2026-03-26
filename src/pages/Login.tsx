import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const { session, loading, signIn, signInWithMagicLink } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [guestMode, setGuestMode] = useState(false)
  const [guestEmail, setGuestEmail] = useState('')
  const [sent, setSent] = useState(false)

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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestEmail.trim()) return
    setSigning(true)
    setError(null)
    const err = await signInWithMagicLink(guestEmail.trim())
    if (err) {
      setError('Email non autorizzata o errore nell\'invio. Contatta un amministratore.')
    } else {
      setSent(true)
    }
    setSigning(false)
  }

  const handleBackToLogin = () => {
    setGuestMode(false)
    setSent(false)
    setGuestEmail('')
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl font-black">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Slokta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Prenota spazi aziendali
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm space-y-6 text-center">
          {!guestMode ? (
            <>
              <div>
                <h2 className="text-lg font-semibold">Accesso riservato</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Accesso riservato agli utenti autorizzati.
                  <br />
                  Usa il tuo account Google per accedere.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={signing}
                className="w-full gap-2"
                size="lg"
              >
                {signing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
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

              <button
                onClick={() => setGuestMode(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sei un ospite? Accedi qui
              </button>
            </>
          ) : sent ? (
            <>
              <div className="flex flex-col items-center gap-3">
                <CheckCircle className="h-10 w-10 text-primary" />
                <h2 className="text-lg font-semibold">Controlla la tua email</h2>
                <p className="text-sm text-muted-foreground">
                  Abbiamo inviato un link di accesso a <span className="font-medium text-foreground">{guestEmail}</span>.
                  <br />
                  Clicca il link per accedere.
                </p>
              </div>
              <button
                onClick={handleBackToLogin}
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft className="h-3 w-3" />
                Torna al login
              </button>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold">Accesso ospite</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Inserisci la tua email. Ti invieremo un link di accesso diretto.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleMagicLink} className="space-y-3">
                <Input
                  type="email"
                  placeholder="tua@email.com"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  required
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={signing || !guestEmail.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {signing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Invia magic link
                </Button>
              </form>

              <button
                onClick={handleBackToLogin}
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft className="h-3 w-3" />
                Torna al login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
