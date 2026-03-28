import { cn } from '@/lib/utils'

const DAYS: { label: string; iso: number }[] = [
  { label: 'Lun', iso: 1 },
  { label: 'Mar', iso: 2 },
  { label: 'Mer', iso: 3 },
  { label: 'Gio', iso: 4 },
  { label: 'Ven', iso: 5 },
  { label: 'Sab', iso: 6 },
  { label: 'Dom', iso: 7 },
]

interface DayPickerProps {
  value: number[]
  onChange: (days: number[]) => void
}

export function DayPicker({ value, onChange }: DayPickerProps) {
  const toggle = (iso: number) => {
    if (value.includes(iso)) {
      onChange(value.filter(d => d !== iso))
    } else {
      onChange([...value, iso].sort((a, b) => a - b))
    }
  }

  return (
    <div className="flex gap-1" role="group" aria-label="Giorni disponibili">
      {DAYS.map(({ label, iso }) => {
        const active = value.includes(iso)
        return (
          <button
            key={iso}
            type="button"
            onClick={() => toggle(iso)}
            aria-pressed={active}
            aria-label={label}
            className={cn(
              'h-8 w-10 rounded text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
