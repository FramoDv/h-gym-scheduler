import { useState } from 'react'
import { addDays, format, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { SlotCard } from '@/components/SlotCard'
import { useSlots } from '@/hooks/useSlots'
import { useMyBookings } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function useActiveSpaces() {
  return useQuery({
    queryKey: ['spaces', 'active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('spaces')
        .select('name')
        .eq('is_active', true)
        .order('created_at')
      return data ?? []
    },
    staleTime: 60 * 1000,
  })
}

function easterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function italianHolidays(year: number): Set<string> {
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  const easter = easterDate(year)
  return new Set([
    `${year}-01-01`, // Capodanno
    `${year}-01-06`, // Epifania
    fmt(easter),                        // Pasqua
    fmt(addDays(easter, 1)),            // Lunedì di Pasqua
    `${year}-04-25`, // Liberazione
    `${year}-05-01`, // Festa del Lavoro
    `${year}-06-02`, // Repubblica
    `${year}-08-15`, // Ferragosto
    `${year}-11-01`, // Ognissanti
    `${year}-12-08`, // Immacolata
    `${year}-12-25`, // Natale
    `${year}-12-26`, // Santo Stefano
  ])
}

function getNextWeekdays(count: number): Date[] {
  const days: Date[] = []
  let current = startOfDay(new Date())
  const year = current.getFullYear()
  const holidays = new Set([...italianHolidays(year), ...italianHolidays(year + 1)])
  while (days.length < count) {
    const isHoliday = holidays.has(format(current, 'yyyy-MM-dd'))
    if (current.getDay() !== 0 && !isHoliday) {
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

const SECTION_ICONS: Record<string, string> = {
  Mattina: '☀️',
  Sera: '🌙',
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
      <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {SECTION_ICONS[title] && <span>{SECTION_ICONS[title]}</span>}
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
  const days = getNextWeekdays(14)
  const [selectedDate, setSelectedDate] = useState<Date>(days[0])
  const { user } = useAuth()
  const { data: slots, isLoading: slotsLoading } = useSlots(selectedDate)
  const { data: myBookings = [] } = useMyBookings()
  const { data: spaces = [] } = useActiveSpaces()
  const spaceTitle = spaces.length === 1
    ? `Prenota una sessione in ${spaces[0].name}`
    : 'Prenota una sessione'

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
        <h1 className="text-2xl font-bold">{spaceTitle}</h1>
        <p className="mt-1 text-muted-foreground">
          Scegli lo slot che preferisci
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
