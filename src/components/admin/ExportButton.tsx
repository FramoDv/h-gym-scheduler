import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import type { AdminBooking } from '@/pages/Admin'
import { formatBookingsCSV } from '@/lib/csv'

interface ExportButtonProps {
  bookings: AdminBooking[]
}

export function ExportButton({ bookings }: ExportButtonProps) {
  const handleExport = () => {
    const csvContent = formatBookingsCSV(bookings)
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
