import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { useFamily } from '@/app/FamilyProvider'
import { Button } from '@/components/m3/Button'
import { Checkbox } from '@/components/m3/Checkbox'
import { CollapsibleSection } from '@/components/m3/CollapsibleSection'
import { addSuggestedItems, readGroupSnapshot, type GroupSnapshot } from '@/data/suggested'
import { CURRENT_MODEL } from '@/domain/listModels'
import { strings } from '@/strings/pt-BR'
import { isSuggestHandled, markSuggestHandled } from '../Welcome/welcomeSeen'

const model = CURRENT_MODEL
const allNames = () => model.categories.flatMap((c) => c.items)

/** /sugestao — offered once to who created (or joined an empty) group; skipped when the group already has items (S-111). */
export function SuggestScreen() {
  const { user } = useAuth()
  const family = useFamily()
  const navigate = useNavigate()
  const uid = user?.uid
  const groupId = family.family?.id
  const [handled] = useState(() => !uid || !groupId || isSuggestHandled(uid, groupId))
  const [snap, setSnap] = useState<GroupSnapshot | null>(null)
  const [skip, setSkip] = useState(false)
  const [marked, setMarked] = useState<Set<string>>(() => new Set(allNames()))
  const [open, setOpen] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (handled || !groupId) return
    let live = true
    readGroupSnapshot(groupId).then(
      (s) => live && (s.hasItems ? setSkip(true) : setSnap(s)),
      () => live && setSkip(true),
    )
    return () => {
      live = false
    }
  }, [handled, groupId])

  if (handled || skip || !uid || !groupId) return <Navigate to="/" replace />
  if (!snap) return <p className="p-4">{strings.loading}</p>

  const t = strings.suggest
  const leave = () => {
    markSuggestHandled(uid, groupId)
    void navigate('/', { replace: true })
  }
  const flip = (set: Set<string>, key: string) => {
    const next = new Set(set)
    if (!next.delete(key)) next.add(key)
    return next
  }
  const setAll = (names: string[], on: boolean) =>
    setMarked((prev) => {
      const next = new Set(prev)
      for (const n of names) {
        if (on) next.add(n)
        else next.delete(n)
      }
      return next
    })

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-3 pb-4">
      <header className="px-4 pt-4">
        <h1 className="m-0 text-2xl font-medium">{t.title}</h1>
        <p className="m-0 pt-2">{t.intro}</p>
      </header>
      <div className="flex-1">
        {model.categories.map((c) => {
          const count = c.items.filter((i) => marked.has(i)).length
          const all = count === c.items.length
          return (
            <CollapsibleSection
              key={c.name}
              title={c.name}
              count={t.count(count, c.items.length)}
              open={open.has(c.name)}
              onToggle={() => setOpen((o) => flip(o, c.name))}
              done={all}
            >
              <li>
                <Checkbox
                  label={t.markAll(c.name)}
                  checked={all}
                  onChange={() => setAll(c.items, !all)}
                />
              </li>
              {c.items.map((name) => (
                <li key={name}>
                  <Checkbox
                    label={name}
                    checked={marked.has(name)}
                    onChange={() => setMarked((m) => flip(m, name))}
                  />
                </li>
              ))}
            </CollapsibleSection>
          )
        })}
      </div>
      <div className="sticky bottom-0 flex gap-2 bg-surface p-4">
        <Button variant="outlined" onClick={leave}>
          {t.empty}
        </Button>
        <Button
          disabled={marked.size === 0}
          onClick={() => {
            addSuggestedItems(groupId, model, marked, snap.categories)
            leave()
          }}
        >
          {t.add(marked.size)}
        </Button>
      </div>
    </main>
  )
}
