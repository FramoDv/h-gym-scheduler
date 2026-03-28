import type { ReactNode } from 'react'
import { Sun, Moon } from 'lucide-react'
import { SlotCard } from '@/components/SlotCard'
import type { useSlots } from '@/hooks/useSlots'

const SECTION_ICONS: Record<string, ReactNode> = {
  Mattina: <Sun className="h-3.5 w-3.5" />,
  Sera: <Moon className="h-3.5 w-3.5" />,
}

export function SlotSection({
  title,
  slots,
  bookedSlotIds,
  bookingIdMap,
  hasBookingForDay,
  onBook,
  isAnyBookingPending,
}: {
  title: string
  slots: ReturnType<typeof useSlots>['data']
  bookedSlotIds: string[]
  bookingIdMap: Record<string, string>
  hasBookingForDay: boolean
  onBook: (slotId: string) => Promise<void>
  isAnyBookingPending: boolean
}) {
  if (!slots || slots.length === 0) return null
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {SECTION_ICONS[title]}
        {title}
      </h3>
      <div className="space-y-2">
        {slots.map(slot => (
          <SlotCard
            key={slot.id}
            slot={slot}
            isBooked={bookedSlotIds.includes(slot.id)}
            bookingId={bookingIdMap[slot.id]}
            hasBookingForDay={hasBookingForDay && !bookedSlotIds.includes(slot.id)}
            onBook={onBook}
            isAnyBookingPending={isAnyBookingPending}
          />
        ))}
      </div>
    </div>
  )
}
