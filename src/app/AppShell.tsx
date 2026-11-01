import { Outlet } from 'react-router'
import { NavigationBar, type NavDestination } from '@/components/m3/NavigationBar'
import { IosInstallHint } from '@/components/IosInstallHint'
import { strings } from '@/strings/pt-BR'

const destinations: NavDestination[] = [
  {
    to: '/',
    label: strings.nav.list,
    icon: 'checklist',
    also: ['/finalizar', '/item'],
  },
  { to: '/despensa', label: strings.pantry.link, icon: 'kitchen' },
  { to: '/historico', label: strings.history.link, icon: 'history' },
  { to: '/familia', label: strings.family.title, icon: 'group', also: ['/categorias'] },
]

/** Layout route for screens with a ready family: fixed bottom tabs (ADR-0019). */
export function AppShell() {
  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <IosInstallHint />
        <Outlet />
      </div>
      <div className="app-shell__nav">
        <NavigationBar label={strings.nav.label} destinations={destinations} />
      </div>
    </div>
  )
}
