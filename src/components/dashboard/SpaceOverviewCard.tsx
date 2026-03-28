import { Users, Calendar, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActiveSpace } from '@/hooks/useActiveSpaces'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function formatAvailableDays(days: number[]): string {
  if (days.length === 0) return 'Nessun giorno'
  if (days.length === 7) return 'Tutti i giorni'
  // Detect Mon–Fri (1–5)
  if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Lun – Ven'
  return days.map(d => DAY_NAMES[d]).join(', ')
}

interface SpaceOverviewCardProps {
  space: ActiveSpace
  onClick: (id: string) => void
  className?: string
}

export function SpaceOverviewCard({ space, onClick, className }: SpaceOverviewCardProps) {
  return (
    <button
      onClick={() => onClick(space.id)}
      className={cn(
        'group flex w-full flex-col gap-4 rounded-xl border bg-card p-5 text-left transition-all',
        'hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold leading-tight">{space.name}</h3>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>

      {space.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {space.max_capacity === 1
              ? '1 posto'
              : `Fino a ${space.max_capacity} posti`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatAvailableDays(space.available_days)}</span>
        </div>
      </div>
    </button>
  )
}
