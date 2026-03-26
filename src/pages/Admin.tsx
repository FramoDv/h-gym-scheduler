import { useState } from 'react'
import { subDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Users, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BookingsTable } from '@/components/admin/BookingsTable'
import { UsageChart } from '@/components/admin/UsageChart'
import { UserChart } from '@/components/admin/UserChart'
import { ExportButton } from '@/components/admin/ExportButton'
import { AccessControl } from '@/components/admin/AccessControl'
import { Spaces } from '@/components/admin/Spaces'
import { Skeleton } from '@/components/ui/skeleton'

export interface AdminBooking {
  id: string
  slot_id: string
  user_id: string
  user_email: string
  user_name: string
  created_at: string
  slots: {
    date: string
    start_time: string
    end_time: string
    spaces: { name: string } | null
  } | null
}

function useAdminBookings(from: string) {
  return useQuery({
    queryKey: ['adminBookings', from],
    queryFn: async (): Promise<AdminBooking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, slots!inner(date, start_time, end_time, spaces(name))')
        .gte('created_at', from)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as AdminBooking[]
    },
    staleTime: 30 * 1000,
  })
}

const RANGES = [
  { label: 'Ultimi 7 giorni', days: 7 },
  { label: 'Ultimi 30 giorni', days: 30 },
  { label: 'Ultimi 90 giorni', days: 90 },
]

function StatCard({ icon: Icon, label, value }: {
  icon: typeof Users
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}

type AdminTab = 'statistiche' | 'spazi' | 'accessi'

export function Admin() {
  const [tab, setTab] = useState<AdminTab>('statistiche')
  const [rangeDays, setRangeDays] = useState(7)
  const from = subDays(new Date(), rangeDays - 1).toISOString()
  const { data: bookings = [], isLoading } = useAdminBookings(from)

  const uniqueUsers = new Set(bookings.map(b => b.user_id)).size
  const avgPerSlot =
    bookings.length > 0
      ? (bookings.length / new Set(bookings.map(b => b.slot_id)).size).toFixed(1)
      : '0'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Area Admin</h1>
          </div>
          <p className="mt-1 text-muted-foreground">Gestione spazi aziendali</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-lg border overflow-hidden w-fit">
        {(['statistiche', 'spazi', 'accessi'] as AdminTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm capitalize transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'statistiche' && (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              {RANGES.map(r => (
                <button
                  key={r.days}
                  onClick={() => setRangeDays(r.days)}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    rangeDays === r.days
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {!isLoading && <ExportButton bookings={bookings} />}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={Users} label="Totale prenotazioni" value={bookings.length} />
              <StatCard icon={Users} label="Utenti unici" value={uniqueUsers} />
              <StatCard icon={TrendingUp} label="Media per slot" value={avgPerSlot} />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-4 font-semibold">Prenotazioni nel tempo</h2>
              {isLoading ? <Skeleton className="h-56 w-full" /> : <UsageChart bookings={bookings} />}
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-4 font-semibold">Top utenti</h2>
              {isLoading ? <Skeleton className="h-56 w-full" /> : <UserChart bookings={bookings} />}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">Prenotazioni</h2>
            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <BookingsTable bookings={bookings} />
            )}
          </div>
        </>
      )}

      {tab === 'spazi' && (
        <div className="rounded-lg border bg-card p-6">
          <Spaces />
        </div>
      )}

      {tab === 'accessi' && (
        <div className="rounded-lg border bg-card p-6">
          <AccessControl />
        </div>
      )}
    </div>
  )
}
