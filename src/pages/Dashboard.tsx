import { useState, useMemo, type ReactNode } from 'react'
import { Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { SlotCard } from '@/components/SlotCard'
import { useSlots } from '@/hooks/useSlots'
import { useMyBookings, useCreateBooking } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { getNextWeekdays } from '@/lib/calendar'

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

const SECTION_ICONS: Record<string, ReactNode> = {
  Mattina: <Sun className="h-3.5 w-3.5" />,
  Sera: <Moon className="h-3.5 w-3.5" />,
}

function SlotSection({
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

export function Dashboard() {
  const days = useMemo(() => getNextWeekdays(14), [])
  const [selectedDate, setSelectedDate] = useState<Date>(days[0])
  const { user } = useAuth()
  const { data: slots, isLoading: slotsLoading } = useSlots(selectedDate)
  const { data: myBookings = [] } = useMyBookings()
  const { data: spaces = [] } = useActiveSpaces()
  const createBooking = useCreateBooking()
  const spaceTitle = spaces.length === 1
    ? `Prenota una sessione in ${spaces[0].name}`
    : 'Prenota una sessione'

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { bookingIdMap, bookedSlotIds } = useMemo(() => {
    const bookingIdMap: Record<string, string> = {}
    const bookedSlotIds: string[] = []
    for (const b of myBookings) {
      if (b.slots?.date === dateStr) {
        bookedSlotIds.push(b.slot_id)
      }
      bookingIdMap[b.slot_id] = b.id
    }
    return { bookingIdMap, bookedSlotIds }
  }, [myBookings, dateStr])

  const hasBookingForDay = bookedSlotIds.length > 0

  const handleBook = async (slotId: string) => {
    await createBooking.mutateAsync({
      slotId,
      userId: user!.id,
      userEmail: user!.email ?? '',
      userName: (user!.user_metadata?.full_name as string | undefined) ?? user!.email ?? '',
      userAvatarUrl: (user!.user_metadata?.avatar_url as string | undefined) ?? undefined,
    })
  }

  const morningSlots = useMemo(
    () => slots?.filter(s => parseInt(s.start_time.split(':')[0]) < 12),
    [slots]
  )
  const eveningSlots = useMemo(
    () => slots?.filter(s => parseInt(s.start_time.split(':')[0]) >= 12),
    [slots]
  )

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
            bookedSlotIds={bookedSlotIds}
            bookingIdMap={bookingIdMap}
            hasBookingForDay={hasBookingForDay}
            onBook={handleBook}
            isAnyBookingPending={createBooking.isPending}
          />
          <SlotSection
            title="Sera"
            slots={eveningSlots}
            bookedSlotIds={bookedSlotIds}
            bookingIdMap={bookingIdMap}
            hasBookingForDay={hasBookingForDay}
            onBook={handleBook}
            isAnyBookingPending={createBooking.isPending}
          />
        </div>
      )}
    </div>
  )
}
