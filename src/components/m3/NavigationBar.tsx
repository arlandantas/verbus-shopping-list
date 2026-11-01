import { Link, useLocation } from 'react-router'
import { Icon, type IconName } from './Icon'
import './m3.css'

/** `also`: extra route prefixes (sub-screens) that keep this destination active. */
export type NavDestination = { to: string; label: string; icon: IconName; also?: string[] }

const under = (pathname: string, prefix: string) =>
  pathname === prefix || (prefix !== '/' && pathname.startsWith(`${prefix}/`))

export function NavigationBar({
  destinations,
  label,
}: {
  destinations: NavDestination[]
  label: string
}) {
  const { pathname } = useLocation()
  return (
    <nav className="m3-nav" aria-label={label}>
      {destinations.map((d) => (
        <Link
          key={d.to}
          to={d.to}
          className="m3-nav__item"
          aria-current={
            [d.to, ...(d.also ?? [])].some((p) => under(pathname, p)) ? 'page' : undefined
          }
        >
          <span className="m3-nav__pill">
            <Icon name={d.icon} />
          </span>
          {d.label}
        </Link>
      ))}
    </nav>
  )
}
