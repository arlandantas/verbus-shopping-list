import { signOut } from '@/data/auth'
import { strings } from '@/strings/pt-BR'

/** Placeholder; content arrives in S-011. */
export function FamilyScreen() {
  return (
    <main className="p-4">
      <h1 className="min-h-12 text-xl">{strings.family.title}</h1>
      <button
        type="button"
        onClick={() => void signOut()}
        className="min-h-12 rounded bg-gray-200 px-4"
      >
        {strings.login.signOut}
      </button>
    </main>
  )
}
