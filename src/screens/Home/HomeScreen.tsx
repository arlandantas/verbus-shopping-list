import { Link } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { strings } from '@/strings/pt-BR'

/** Placeholder until the shopping list (M2). */
export function HomeScreen() {
  const { family } = useFamily()
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-4">
      <h1 className="min-h-12 text-xl">{family?.name}</h1>
      <p>{strings.home.placeholder}</p>
      <Link to="/familia" className="flex min-h-12 items-center underline">
        {strings.family.title}
      </Link>
    </main>
  )
}
