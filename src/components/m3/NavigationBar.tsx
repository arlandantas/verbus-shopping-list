import { NavLink } from 'react-router'
import { Icon, type IconName } from './Icon'
import './m3.css'

export type NavDestination = { to: string; label: string; icon: IconName }

export function NavigationBar({
  destinations,
  label,
}: {
  destinations: NavDestination[]
  label: string
}) {
  return (
    <nav className="m3-nav" aria-label={label}>
      {destinations.map((d) => (
        <NavLink key={d.to} to={d.to} className="m3-nav__item">
          <span className="m3-nav__pill">
            <Icon name={d.icon} />
          </span>
          {d.label}
        </NavLink>
      ))}
    </nav>
  )
}
