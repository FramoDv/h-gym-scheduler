import { format, parseISO } from 'date-fns'
import type { AdminBooking } from '@/pages/Admin'

export function formatBookingsCSV(bookings: AdminBooking[]): string {
  const headers = ['Data', 'Orario', 'Spazio', 'Utente', 'Email', 'Prenotato il']
  const rows = bookings.map(b => [
    b.slots ? format(parseISO(b.slots.date), 'dd/MM/yyyy') : '',
    b.slots ? `${b.slots.start_time.slice(0, 5)}-${b.slots.end_time.slice(0, 5)}` : '',
    b.slots?.spaces?.name ?? '',
    b.user_name,
    b.user_email,
    b.created_at ? format(parseISO(b.created_at), 'dd/MM/yyyy HH:mm') : '',
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
