import { useNavigate } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { BottomSheet } from '@/components/m3/BottomSheet'
import { Icon } from '@/components/m3/Icon'
import { strings } from '@/strings/pt-BR'

const ROW =
  'flex min-h-12 w-full items-center gap-3 rounded px-4 text-left text-base text-on-surface'

/** Bottom sheet to switch the active group (ADR-0024). Create/join entries land on the Grupo tab (S-091 adds the flows). */
export function GroupSwitcher({ onClose }: { onClose: () => void }) {
  const { family, groups, setActiveGroup } = useFamily()
  const navigate = useNavigate()
  const go = () => {
    // The sheet unwinds its own history entry asynchronously: navigate after that pop, not before.
    window.addEventListener('popstate', () => void navigate('/grupo'), { once: true })
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
          <button type="button" className={ROW} onClick={go}>
            <Icon name="add" />
            {strings.groups.createNew}
          </button>
        </li>
        <li>
          <button type="button" className={ROW} onClick={go}>
            <Icon name="group" />
            {strings.groups.joinWithCode}
          </button>
        </li>
      </ul>
    </BottomSheet>
  )
}
