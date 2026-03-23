import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, Clock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyBookings, useDeleteBooking } from '@/hooks/useBookings'

export function MyBookings() {
  const { data: bookings, isLoading } = useMyBookings()
  const deleteBooking = useDeleteBooking()

  const handleCancel = async (bookingId: string) => {
    try {
      await deleteBooking.mutateAsync(bookingId)
      toast.success('Prenotazione cancellata.')
    } catch {
      toast.error('Errore durante la cancellazione. Riprova.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Le mie prenotazioni</h1>
        <p className="mt-1 text-muted-foreground">
          Le tue prenotazioni future
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            Nessuna prenotazione
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Vai nella dashboard per prenotare uno slot
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map(booking => {
            const date = booking.slots ? parseISO(booking.slots.date) : null
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-bold text-primary leading-none">
                      {date ? format(date, 'd') : '?'}
                    </span>
                    <span className="text-[10px] uppercase text-primary/70 leading-none">
                      {date ? format(date, 'MMM', { locale: it }) : ''}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {date
                        ? format(date, 'EEEE d MMMM', { locale: it })
                        : 'Data sconosciuta'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {booking.slots
                        ? `${booking.slots.start_time.slice(0, 5)} – ${booking.slots.end_time.slice(0, 5)}`
                        : '—'}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCancel(booking.id)}
                  disabled={deleteBooking.isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
