import { Outlet } from 'react-router'
import { NavigationBar, type NavDestination } from '@/components/m3/NavigationBar'
import { useFamily } from '@/app/FamilyProvider'
import { InstallHint } from '@/components/InstallHint'
import { strings } from '@/strings/pt-BR'

const pantryTab: NavDestination = { to: '/despensa', label: strings.pantry.link, icon: 'kitchen' }

function destinations(recurringEnabled: boolean): NavDestination[] {
  return [
    { to: '/', label: strings.nav.list, icon: 'checklist', also: ['/finalizar', '/item'] },
    ...(recurringEnabled ? [pantryTab] : []),
    { to: '/historico', label: strings.history.link, icon: 'history' },
    { to: '/grupo', label: strings.family.title, icon: 'group', also: ['/categorias'] },
  ]
}

/** Layout route for screens with a ready family: fixed bottom tabs (ADR-0019). */
export function AppShell() {
  const { family } = useFamily()
  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <InstallHint />
        <Outlet />
      </div>
      <div className="app-shell__nav">
        <NavigationBar
          label={strings.nav.label}
          destinations={destinations(family?.recurringEnabled !== false)}
        />
      </div>
    </div>
  )
}
