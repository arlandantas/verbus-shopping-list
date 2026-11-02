import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { WELCOME_ROUTE, cancelWelcome, isWelcomePending } from './welcomeSeen'

/** Wraps the Grupo screen: right after creating/joining a group it sends the user to the welcome steps. */
export function WelcomeGate({ children }: { children: ReactNode }) {
  const [go] = useState(isWelcomePending)
  useEffect(() => {
    if (go) cancelWelcome()
  }, [go])
  return go ? <Navigate to={WELCOME_ROUTE} replace /> : children
}
