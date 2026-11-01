import type { ReactNode } from 'react'
import './m3.css'

type Props = {
  title: string
  subtitle?: string
  navigation?: ReactNode
  actions?: ReactNode
}

export function TopAppBar({ title, subtitle, navigation, actions }: Props) {
  return (
    <header className="m3-top-bar">
      {navigation}
      <div className="m3-top-bar__titles">
        <h1 className="m3-top-bar__title">{title}</h1>
        {subtitle && <p className="m3-top-bar__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="m3-top-bar__actions">{actions}</div>}
    </header>
  )
}
