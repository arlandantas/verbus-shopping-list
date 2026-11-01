import { useNavigate } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { BottomSheet } from '@/components/m3/BottomSheet'
import { Icon } from '@/components/m3/Icon'
import { strings } from '@/strings/pt-BR'

const ROW =
  'flex min-h-12 w-full items-center gap-3 rounded px-4 text-left text-base text-on-surface'

let navigating = false

/** Bottom sheet to switch the active group (ADR-0024). Create/join entries open the matching form on the Grupo tab (S-091). */
export function GroupSwitcher({ onClose }: { onClose: () => void }) {
  const { family, groups, setActiveGroup } = useFamily()
  const navigate = useNavigate()
  const go = (action: 'create' | 'join') => {
    if (navigating) return
    navigating = true
    // The sheet unwinds its own history entry asynchronously (and unmounts us): navigate after
    // that pop, once. The timer is the fallback when no pop comes, so no listener ever lingers.
    const run = () => {
      window.removeEventListener('popstate', run)
      clearTimeout(timer)
      navigating = false
      void navigate('/grupo', { state: { action } })
    }
    const timer = setTimeout(run, 500)
    window.addEventListener('popstate', run)
    onClose()
  }
  return (
    <BottomSheet open title={strings.groups.sheetTitle} onClose={onClose}>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {groups.map((g) => {
          const active = g.id === family?.id
          return (
            <li key={g.id}>
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                className={`${ROW} ${active ? 'bg-secondary-container text-on-secondary-container' : ''}`}
                onClick={() => {
                  setActiveGroup(g.id)
                  onClose()
                }}
              >
                <span className="flex-1">{g.name}</span>
                {active && (
                  <>
                    <Icon name="check" />
                    <span className="sr-only">{strings.groups.active}</span>
                  </>
                )}
              </button>
            </li>
          )
        })}
        <li>
          <button type="button" className={ROW} onClick={() => go('create')}>
            <Icon name="add" />
            {strings.groups.createNew}
          </button>
        </li>
        <li>
          <button type="button" className={ROW} onClick={() => go('join')}>
            <Icon name="group" />
            {strings.groups.joinWithCode}
          </button>
        </li>
      </ul>
    </BottomSheet>
  )
}
