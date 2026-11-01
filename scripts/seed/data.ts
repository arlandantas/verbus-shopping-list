// Pure seed content (S-050). Kept free of src/ imports so plain Node can run it; tests assert it
// stays in sync with the domain (categories, nameKey, units).
export const FAMILY_ID = 'familia-teste'
export const FAMILY_NAME = 'Casa Teste'
/** Valid invite code (ADR-0003 alphabet) so the sem-família account can try joining. */
export const INVITE_CODE = 'CASA2345'

export const SEED_CATEGORIES = [
  { id: 'mercearia', name: 'Mercearia', order: 0 },
  { id: 'hortifruti', name: 'Hortifrúti', order: 1 },
  { id: 'carnes', name: 'Carnes', order: 2 },
  { id: 'laticinios', name: 'Laticínios', order: 3 },
  { id: 'limpeza', name: 'Limpeza', order: 4 },
  { id: 'higiene', name: 'Higiene pessoal', order: 5 },
] as const

export interface SeedItem {
  id: string
  name: string
  nameKey: string
  quantity: number
  unit: string
  note: string | null
  categoryId: string | null
  recurring: boolean
  /** Who marks it bought after creation (account key); undefined = stays pending. */
  boughtBy?: 'ana' | 'beto'
  priceCents?: number
}

export const SEED_ITEMS: readonly SeedItem[] = [
  {
    id: 'arroz',
    name: 'Arroz',
    nameKey: 'arroz',
    quantity: 5,
    unit: 'kg',
    note: null,
    categoryId: 'mercearia',
    recurring: true,
  },
  {
    id: 'feijao',
    name: 'Feijão',
    nameKey: 'feijao',
    quantity: 2,
    unit: 'kg',
    note: 'carioca',
    categoryId: 'mercearia',
    recurring: true,
    boughtBy: 'ana',
    priceCents: 1190,
  },
  {
    id: 'banana',
    name: 'Banana',
    nameKey: 'banana',
    quantity: 1,
    unit: 'dz',
    note: null,
    categoryId: 'hortifruti',
    recurring: false,
  },
  {
    id: 'tomate',
    name: 'Tomate',
    nameKey: 'tomate',
    quantity: 1.5,
    unit: 'kg',
    note: null,
    categoryId: 'hortifruti',
    recurring: false,
    boughtBy: 'beto',
    priceCents: 899,
  },
  {
    id: 'frango',
    name: 'Frango',
    nameKey: 'frango',
    quantity: 1,
    unit: 'kg',
    note: 'peito',
    categoryId: 'carnes',
    recurring: false,
  },
  {
    id: 'leite',
    name: 'Leite',
    nameKey: 'leite',
    quantity: 6,
    unit: 'l',
    note: null,
    categoryId: 'laticinios',
    recurring: true,
  },
  {
    id: 'queijo',
    name: 'Queijo mussarela',
    nameKey: 'queijo mussarela',
    quantity: 300,
    unit: 'g',
    note: null,
    categoryId: 'laticinios',
    recurring: false,
    boughtBy: 'ana',
    priceCents: 1850,
  },
  {
    id: 'detergente',
    name: 'Detergente',
    nameKey: 'detergente',
    quantity: 3,
    unit: 'un',
    note: null,
    categoryId: 'limpeza',
    recurring: false,
  },
  {
    id: 'sabonete',
    name: 'Sabonete',
    nameKey: 'sabonete',
    quantity: 4,
    unit: 'un',
    note: null,
    categoryId: 'higiene',
    recurring: false,
    boughtBy: 'beto',
    priceCents: 640,
  },
  {
    id: 'pilhas',
    name: 'Pilhas AA',
    nameKey: 'pilhas aa',
    quantity: 1,
    unit: 'pct',
    note: null,
    categoryId: null,
    recurring: false,
  },
]

export interface SeedCatalogEntry {
  name: string
  nameKey: string
  quantity: number
  unit: string
  categoryId: string | null
  recurring?: boolean
}

export const SEED_CATALOG: readonly SeedCatalogEntry[] = [
  ...SEED_ITEMS.map((i) => ({
    name: i.name,
    nameKey: i.nameKey,
    quantity: i.quantity,
    unit: i.unit,
    categoryId: i.categoryId,
    ...(i.recurring ? { recurring: true } : {}),
  })),
  {
    name: 'Café',
    nameKey: 'cafe',
    quantity: 500,
    unit: 'g',
    categoryId: 'mercearia',
    recurring: true,
  },
  { name: 'Ovos', nameKey: 'ovos', quantity: 1, unit: 'dz', categoryId: 'mercearia' },
  {
    name: 'Papel higiênico',
    nameKey: 'papel higienico',
    quantity: 12,
    unit: 'un',
    categoryId: 'higiene',
    recurring: true,
  },
]
