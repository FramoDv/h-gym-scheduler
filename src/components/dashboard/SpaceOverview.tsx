import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SpaceOverviewCard } from '@/components/dashboard/SpaceOverviewCard'
import { useActiveSpaces } from '@/hooks/useActiveSpaces'

export function SpaceOverview() {
  const navigate = useNavigate()
  const { data: spaces = [], isLoading } = useActiveSpaces()

  // Single space: auto-navigate directly to booking view
  useEffect(() => {
    if (spaces.length === 1) {
      navigate(`/space/${spaces[0].id}`, { replace: true })
    }
  }, [spaces, navigate])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prenota una sessione</h1>
        <p className="mt-1 text-muted-foreground">Seleziona lo spazio che vuoi prenotare</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map(i => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <Dumbbell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">Nessuno spazio disponibile</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contatta un amministratore per abilitare gli spazi
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {spaces.map(space => (
            <SpaceOverviewCard
              key={space.id}
              space={space}
              onClick={id => navigate(`/space/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
