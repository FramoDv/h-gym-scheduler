import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { AdminBooking } from '@/pages/Admin'

interface UsageChartProps {
  bookings: AdminBooking[]
}

interface ChartEntry {
  label: string
  count: number
}

export function UsageChart({ bookings }: UsageChartProps) {
  // Group bookings by date+slot
  const slotMap: Record<string, ChartEntry> = {}

  for (const b of bookings) {
    if (!b.slots) continue
    const key = `${b.slots.date}_${b.slots.start_time}`
    const date = parseISO(b.slots.date)
    const label = `${format(date, 'EEE d', { locale: it })}\n${b.slots.start_time.slice(0, 5)}`
    if (!slotMap[key]) {
      slotMap[key] = { label, count: 0 }
    }
    slotMap[key].count++
  }

  const data = Object.values(slotMap).slice(0, 20)

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        Nessun dato da visualizzare
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--card)',
          }}
          formatter={(value) => [`${value} prenotazioni`, 'Slot']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="hsl(var(--primary))" opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
