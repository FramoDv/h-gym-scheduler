import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminBooking } from '@/pages/Admin'

interface BookingsTableProps {
  bookings: AdminBooking[]
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Nessuna prenotazione trovata per il periodo selezionato.
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Orario</TableHead>
            <TableHead>Utente</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Prenotato il</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map(b => {
            const slotDate = b.slots ? parseISO(b.slots.date) : null
            return (
              <TableRow key={b.id}>
                <TableCell className="font-medium">
                  {slotDate
                    ? format(slotDate, 'EEE d MMM', { locale: it })
                    : '—'}
                </TableCell>
                <TableCell>
                  {b.slots
                    ? `${b.slots.start_time.slice(0, 5)} – ${b.slots.end_time.slice(0, 5)}`
                    : '—'}
                </TableCell>
                <TableCell>{b.user_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {b.user_email}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(parseISO(b.created_at), 'd MMM HH:mm', { locale: it })}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
