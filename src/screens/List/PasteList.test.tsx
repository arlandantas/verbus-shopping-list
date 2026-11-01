import '@testing-library/jest-dom/vitest'
import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import axe from 'axe-core'
import { MemoryRouter } from 'react-router'
import type { CatalogEntry } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { ListScreen } from './ListScreen'

const addItems = vi.hoisted(() => vi.fn())
const itemsState = vi.hoisted(() => ({ items: [] as unknown[] }))
vi.mock('@/data/items', () => ({
  addItem: vi.fn(),
  addItems,
  toggleItemStatus: vi.fn(),
  setItemStatus: vi.fn(),
}))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({
    family: { id: 'g2', name: 'Casa' },
    recurringAdded: 0,
    dismissRecurringNotice: vi.fn(),
  }),
}))
vi.mock('@/app/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('@/hooks/useMemberNames', () => ({ useMemberNames: () => ({}) }))
vi.mock('./useItems', () => ({ useItems: () => itemsState.items }))
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => [{ id: 'c1', name: 'Mercearia', isDefault: true, order: 1 }],
}))
const catalog: CatalogEntry[] = [
  {
    name: 'Arroz',
    nameKey: 'arroz',
    quantity: 5,
    unit: 'kg',
    categoryId: 'c1',
    recurring: true,
    lastUsedAt: new Date(),
  },
]
vi.mock('./useCatalog', () => ({ useCatalog: () => catalog }))

const TEXT = '- arroz\n- 2 kg feijão\n\n- leite'
const field = () => screen.getByLabelText(strings.list.addLabel) as HTMLInputElement
const paste = (text: string) => {
  const ev = createEvent.paste(field(), { clipboardData: { getData: () => text } })
  fireEvent(field(), ev)
  return ev
}
const renderIt = () =>
  render(
    <MemoryRouter>
      <ListScreen />
    </MemoryRouter>,
  )

beforeEach(() => {
  addItems.mockReset()
  itemsState.items = []
})
afterEach(cleanup)

describe('S-093 AC8: paste opens the preview', () => {
  it('multi-line paste is prevented, field untouched, sheet lists one row per item', () => {
    renderIt()
    const ev = paste(TEXT)
    expect(ev.defaultPrevented).toBe(true)
    expect(field().value).toBe('')
    expect(screen.getByRole('dialog', { name: strings.list.paste.title })).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    expect(screen.getByRole('checkbox', { name: 'Arroz' })).toBeChecked()
    expect(screen.getByText('5 kg · Mercearia')).toBeInTheDocument()
    expect(screen.getByText('2 kg')).toBeInTheDocument()
  })

  it('single-line paste is left to the browser', () => {
    renderIt()
    expect(paste('1,5 kg arroz').defaultPrevented).toBe(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('S-093 AC9: duplicates, count and truncation', () => {
  it('pending duplicates start unchecked; unchecking updates the count; 0 disables', () => {
    itemsState.items = [{ id: 'i1', status: 'pending', nameKey: 'leite', name: 'leite' }]
    renderIt()
    paste(TEXT)
    const dlg = within(screen.getByRole('dialog'))
    expect(dlg.getByRole('checkbox', { name: 'leite' })).not.toBeChecked()
    expect(screen.getByText(/Já está na lista/)).toBeInTheDocument()
    const confirm = () => screen.getByRole('button', { name: strings.list.paste.confirm(2) })
    expect(confirm()).toBeEnabled()
    fireEvent.click(dlg.getByRole('checkbox', { name: 'Arroz' }))
    fireEvent.click(dlg.getByRole('checkbox', { name: 'feijão' }))
    expect(screen.getByRole('button', { name: 'Adicionar (0)' })).toBeDisabled()
  })

  it('warns when truncated', () => {
    renderIt()
    paste(Array.from({ length: 101 }, (_, i) => `item ${i}`).join('\n'))
    expect(screen.getByText(strings.list.paste.truncated)).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(100)
  })
})

describe('S-093 AC10: confirm and cancel', () => {
  it('confirm writes checked rows to the active group, closes, shows snackbar, refocuses', () => {
    renderIt()
    field().focus()
    paste(TEXT)
    fireEvent.click(screen.getByRole('checkbox', { name: 'leite' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar (2)' }))
    expect(addItems).toHaveBeenCalledWith('g2', [
      { name: 'Arroz', quantity: 5, unit: 'kg', categoryId: 'c1', recurring: true },
      { name: 'feijão', quantity: 2, unit: 'kg', categoryId: null },
    ])
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('2 itens adicionados')).toBeInTheDocument()
    expect(field()).toHaveFocus()
  })

  it('cancel and close write nothing', () => {
    renderIt()
    paste(TEXT)
    fireEvent.click(screen.getByRole('button', { name: strings.overlay.cancel }))
    expect(screen.queryByRole('dialog')).toBeNull()
    paste(TEXT)
    fireEvent.click(screen.getByRole('button', { name: strings.overlay.close }))
    expect(addItems).not.toHaveBeenCalled()
    expect(screen.queryByText(/adicionados/)).toBeNull()
  })
})

describe('S-093 AC11: accessibility', () => {
  it('labelled dialog, focus on confirm, no axe violations', async () => {
    renderIt()
    paste(TEXT)
    const dialog = screen.getByRole('dialog', { name: strings.list.paste.title })
    expect(screen.getByRole('button', { name: 'Adicionar (3)' })).toHaveFocus()
    const result = await act(() => axe.run(dialog, { rules: { region: { enabled: false } } }))
    expect(result.violations.map((v) => v.id)).toEqual([])
  })
})
