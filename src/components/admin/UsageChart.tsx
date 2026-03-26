import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'
import type { AdminBooking } from '@/pages/Admin'

interface UsageChartProps {
  bookings: AdminBooking[]
}

export function UsageChart({ bookings }: UsageChartProps) {
  const dateMap: Record<string, number> = {}

  for (const b of bookings) {
    if (!b.slots) continue
    const date = b.slots.date
    dateMap[date] = (dateMap[date] ?? 0) + 1
  }

  const data = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      label: format(parseISO(date), 'EEE d', { locale: it }),
      count,
    }))

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        Nessun dato da visualizzare
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
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
          formatter={(value) => [`${value} prenotazioni`, 'Giorno']}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={<Dot r={3} fill="hsl(var(--primary))" />}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
