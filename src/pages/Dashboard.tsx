import { useState } from 'react'
import { addDays, format, isWeekend, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { SlotCard } from '@/components/SlotCard'
import { useSlots } from '@/hooks/useSlots'
import { useMyBookings } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

function getNextWeekdays(count: number): Date[] {
  const days: Date[] = []
  let current = startOfDay(new Date())
  while (days.length < count) {
    if (!isWeekend(current)) {
      days.push(current)
    }
    current = addDays(current, 1)
  }
  return days
}

function DateSelector({
  days,
  selected,
  onSelect,
}: {
  days: Date[]
  selected: Date
  onSelect: (d: Date) => void
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {days.map(day => {
        const isSelected = format(day, 'yyyy-MM-dd') === format(selected, 'yyyy-MM-dd')
        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelect(day)}
            className={cn(
              'flex shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
            )}
          >
            <span className="text-[10px] font-medium uppercase opacity-70 leading-tight">
              {format(day, 'EEE', { locale: it })}
            </span>
            <span className="text-base font-bold leading-tight">
              {format(day, 'd')}
            </span>
            <span className="text-[10px] opacity-70 leading-tight">
              {format(day, 'MMM', { locale: it })}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SlotSection({
  title,
  slots,
  user,
  bookedSlotIds,
  bookingIdMap,
  hasBookingForDay,
}: {
  title: string
  slots: ReturnType<typeof useSlots>['data']
  user: NonNullable<ReturnType<typeof useAuth>['user']>
  bookedSlotIds: string[]
  bookingIdMap: Record<string, string>
  hasBookingForDay: boolean
}) {
  if (!slots || slots.length === 0) return null
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">
        {slots.map(slot => (
          <SlotCard
            key={slot.id}
            slot={slot}
            user={user}
            isBooked={bookedSlotIds.includes(slot.id)}
            bookingId={bookingIdMap[slot.id]}
            hasBookingForDay={hasBookingForDay && !bookedSlotIds.includes(slot.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function Dashboard() {
  const days = getNextWeekdays(10)
  const [selectedDate, setSelectedDate] = useState<Date>(days[0])
  const { user } = useAuth()
  const { data: slots, isLoading: slotsLoading } = useSlots(selectedDate)
  const { data: myBookings = [] } = useMyBookings()

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const bookingIdMap: Record<string, string> = {}
  const bookedSlotIds: string[] = []
  for (const b of myBookings) {
    if (b.slots?.date === dateStr) {
      bookedSlotIds.push(b.slot_id)
    }
    bookingIdMap[b.slot_id] = b.id
  }
  const hasBookingForDay = bookedSlotIds.length > 0

  const morningSlots = slots?.filter(s => {
    const hour = parseInt(s.start_time.split(':')[0])
    return hour < 12
  })
  const eveningSlots = slots?.filter(s => {
    const hour = parseInt(s.start_time.split(':')[0])
    return hour >= 12
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prenota uno slot</h1>
        <p className="mt-1 text-muted-foreground">
          Scegli il giorno e l'orario che preferisci
        </p>
      </div>

      <DateSelector days={days} selected={selectedDate} onSelect={setSelectedDate} />

      {slotsLoading ? (
        <div className="space-y-6">
          {[0, 1].map(g => (
            <div key={g} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              {[0, 1, 2].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : !slots || slots.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Nessuno slot disponibile per questo giorno.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <SlotSection
            title="Mattina"
            slots={morningSlots}
            user={user!}
            bookedSlotIds={bookedSlotIds}
            bookingIdMap={bookingIdMap}
            hasBookingForDay={hasBookingForDay}
          />
          <SlotSection
            title="Sera"
            slots={eveningSlots}
            user={user!}
            bookedSlotIds={bookedSlotIds}
            bookingIdMap={bookingIdMap}
            hasBookingForDay={hasBookingForDay}
          />
        </div>
      )}
    </div>
  )
}
