import { Download } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import type { AdminBooking } from '@/pages/Admin'

interface ExportButtonProps {
  bookings: AdminBooking[]
}

export function ExportButton({ bookings }: ExportButtonProps) {
  const handleExport = () => {
    const headers = ['Data', 'Orario', 'Utente', 'Email', 'Prenotato il']
    const rows = bookings.map(b => [
      b.slots ? format(parseISO(b.slots.date), 'dd/MM/yyyy') : '',
      b.slots ? `${b.slots.start_time.slice(0, 5)}-${b.slots.end_time.slice(0, 5)}` : '',
      b.user_name,
      b.user_email,
      format(parseISO(b.created_at), 'dd/MM/yyyy HH:mm'),
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prenotazioni_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Esporta CSV
    </Button>
  )
}
