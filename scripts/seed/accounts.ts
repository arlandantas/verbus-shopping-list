// Fake accounts for the LOCAL EMULATOR only (S-050). Single source of the fake credentials:
// the seed and the dev-only login panel both read this file; production bundles never import it.
export interface TestAccount {
  key: string
  displayName: string
  email: string
  password: string
  /** Short hint shown on the quick-login button. */
  hint: string
  /** true = belongs to the seeded family; false = no family (tests create/join). */
  family: boolean
}

const PASSWORD = 'Teste-7e8f1fb502c3'

export const TEST_ACCOUNTS: readonly TestAccount[] = [
  {
    key: 'ana',
    displayName: 'Ana',
    email: 'ana@teste.local',
    password: PASSWORD,
    hint: 'casal, com família',
    family: true,
  },
  {
    key: 'beto',
    displayName: 'Beto',
    email: 'beto@teste.local',
    password: PASSWORD,
    hint: 'casal, com família',
    family: true,
  },
  {
    key: 'carla',
    displayName: 'Carla',
    email: 'carla@teste.local',
    password: PASSWORD,
    hint: 'sem família',
    family: false,
  },
]
