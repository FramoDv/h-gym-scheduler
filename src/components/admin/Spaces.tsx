import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Space {
  id: string
  name: string
  description: string | null
  is_active: boolean
  booking_count: number
}

function useSpaces() {
  return useQuery({
    queryKey: ['spaces'],
    queryFn: async (): Promise<Space[]> => {
      const { data, error } = await supabase
        .from('spaces')
        .select('id, name, description, is_active, slots(bookings(id))')
        .order('created_at')
      if (error) throw error
      type SpaceRow = {
        id: string
        name: string
        description: string | null
        is_active: boolean
        slots: { bookings: { id: string }[] }[]
      }
      return (data ?? []).map((s: SpaceRow) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        is_active: s.is_active,
        booking_count: (s.slots ?? []).reduce((sum, slot) => sum + (slot.bookings?.length ?? 0), 0),
      }))
    },
  })
}

export function Spaces() {
  const queryClient = useQueryClient()
  const { data: spaces = [], isLoading } = useSpaces()
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const addSpace = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('spaces')
        .insert({ name: newName.trim(), description: newDescription.trim() || null })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      setNewName('')
      setNewDescription('')
      toast.success('Spazio aggiunto.')
    },
    onError: () => toast.error('Errore durante l\'aggiunta.'),
  })

  const updateSpace = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string | null }) => {
      const { error } = await supabase
        .from('spaces')
        .update({ name, description })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.invalidateQueries({ queryKey: ['spaces', 'active'] })
      setEditingId(null)
      toast.success('Spazio aggiornato.')
    },
    onError: () => toast.error('Errore durante l\'aggiornamento.'),
  })

  const toggleSpace = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('spaces').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.invalidateQueries({ queryKey: ['spaces', 'active'] })
    },
    onError: () => toast.error('Errore durante l\'aggiornamento.'),
  })

  const deleteSpace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('spaces').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.invalidateQueries({ queryKey: ['spaces', 'active'] })
      toast.success('Spazio eliminato.')
    },
    onError: () => toast.error('Errore durante l\'eliminazione.'),
  })

  const startEdit = (space: Space) => {
    setEditingId(space.id)
    setEditName(space.name)
    setEditDescription(space.description ?? '')
  }

  const cancelEdit = () => setEditingId(null)

  const confirmEdit = (id: string) => {
    if (!editName.trim()) return
    updateSpace.mutate({ id, name: editName.trim(), description: editDescription.trim() || null })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Spazi</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ogni spazio attivo genera i propri slot prenotabili.
        </p>
      </div>

      {/* Lista spazi */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Caricamento…</p>
        ) : spaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuno spazio configurato.</p>
        ) : (
          spaces.map(space => (
            <div key={space.id} className="rounded-lg border bg-background px-4 py-3">
              {editingId === space.id ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="sm:w-40"
                    autoFocus
                  />
                  <Input
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Descrizione (opzionale)"
                  />
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => confirmEdit(space.id)} disabled={!editName.trim() || updateSpace.isPending}>
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{space.name}</span>
                      <Badge variant={space.is_active ? 'default' : 'secondary'} className="text-xs">
                        {space.is_active ? 'Attivo' : 'Disattivo'}
                      </Badge>
                    </div>
                    {space.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{space.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => startEdit(space)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Modifica spazio ${space.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleSpace.mutate({ id: space.id, is_active: !space.is_active })}
                      className="px-2 py-0.5 text-xs rounded border transition-colors hover:bg-accent"
                      aria-pressed={space.is_active}
                      aria-label={space.is_active ? `Disattiva spazio ${space.name}` : `Attiva spazio ${space.name}`}
                    >
                      {space.is_active ? 'Disattiva' : 'Attiva'}
                    </button>
                    <button
                      onClick={() => deleteSpace.mutate(space.id)}
                      disabled={space.booking_count > 0 || deleteSpace.isPending}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={space.booking_count > 0 ? `Impossibile eliminare ${space.name}: ha prenotazioni attive` : `Elimina spazio ${space.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Aggiungi spazio */}
      <div className="space-y-3 rounded-lg border bg-background p-4">
        <h4 className="text-sm font-medium">Aggiungi spazio</h4>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Nome (es. Sala Riunioni)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="sm:w-48"
          />
          <Input
            placeholder="Descrizione (opzionale)"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => addSpace.mutate()}
            disabled={!newName.trim() || addSpace.isPending}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Aggiungi
          </Button>
        </div>
      </div>
    </div>
  )
}
