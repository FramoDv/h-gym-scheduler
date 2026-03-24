import { Clock, Users, AlertTriangle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SlotWithCount } from '@/hooks/useSlots'
import { useCreateBooking, useDeleteBooking } from '@/hooks/useBookings'
import type { User } from '@supabase/supabase-js'

interface SlotCardProps {
  slot: SlotWithCount
  user: User
  isBooked: boolean
  bookingId?: string
  hasBookingForDay?: boolean
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

export function SlotCard({ slot, user, isBooked, bookingId, hasBookingForDay }: SlotCardProps) {
  const available = slot.max_capacity - slot.booking_count
  const isFull = available <= 0
  const isUnderMin = slot.booking_count < slot.min_capacity

  const slotStart = new Date(`${slot.date}T${slot.start_time}`)
  const isCutoffPassed = slotStart.getTime() - Date.now() < 60 * 60 * 1000
  const createBooking = useCreateBooking()
  const deleteBooking = useDeleteBooking()

  const handleBook = async () => {
    try {
      await createBooking.mutateAsync({
        slotId: slot.id,
        userId: user.id,
        userEmail: user.email ?? '',
        userName: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? '',
      })
      toast.success('Prenotazione confermata!')
    } catch {
      toast.error('Errore durante la prenotazione. Riprova.')
    }
  }

  const handleCancel = async () => {
    if (!bookingId) return
    try {
      await deleteBooking.mutateAsync(bookingId)
      toast.success('Prenotazione cancellata.')
    } catch {
      toast.error('Errore durante la cancellazione. Riprova.')
    }
  }

  if (slot.is_cancelled) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/40 p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Slot annullato (minimo {slot.min_capacity} partecipanti non raggiunto)
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">Annullato</Badge>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 transition-colors',
        isBooked && 'border-primary/30 bg-primary/5',
        isFull && !isBooked && 'opacity-60'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              <span className="ml-1.5 text-xs text-muted-foreground">(+15 min uscita)</span>
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{slot.booking_count}/{slot.max_capacity} posti occupati</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBooked ? (
            <>
              <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/20">
                Prenotato
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={deleteBooking.isPending || isCutoffPassed}
                className="text-destructive hover:text-destructive"
              >
                Cancella
              </Button>
            </>
          ) : isFull ? (
            <Badge variant="secondary">Completo</Badge>
          ) : isCutoffPassed ? (
            <Badge variant="secondary">Chiuso</Badge>
          ) : hasBookingForDay ? (
            <Badge variant="secondary">Hai già uno slot oggi</Badge>
          ) : (
            <Button size="sm" onClick={handleBook} disabled={createBooking.isPending}>
              Prenota
            </Button>
          )}
        </div>
      </div>

      {/* Badge minimo non raggiunto */}
      {!isFull && isUnderMin && (
        <div className="mt-3 flex items-center gap-1.5 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs text-yellow-700 dark:border-yellow-800/50 dark:bg-yellow-900/20 dark:text-yellow-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Minimo {slot.min_capacity} partecipanti richiesti — attualmente {slot.booking_count}.
            Lo slot verrà annullato se non si raggiunge il minimo entro 1 ora dall'inizio.
          </span>
        </div>
      )}
    </div>
  )
}
