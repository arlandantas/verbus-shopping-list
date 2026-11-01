import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Category } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { CategoriesScreen } from './CategoriesScreen'

const h = vi.hoisted(() => ({
  addCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))
vi.mock('@/data/categories', () => h)
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))

let categories: Category[] = []
vi.mock('@/hooks/useCategories', () => ({ useCategories: () => categories }))

const cat = (id: string, name: string, isDefault: boolean, order: number): Category => ({
  id,
  name,
  isDefault,
  order,
})

const renderIt = () =>
  render(
    <MemoryRouter>
      <CategoriesScreen />
    </MemoryRouter>,
  )

beforeEach(() => {
  Object.values(h).forEach((f) => f.mockReset())
  categories = [cat('mercearia', 'Mercearia', true, 0), cat('c1', 'Pet', false, 6)]
})

describe('S-042 CategoriesScreen', () => {
  it('AC1: defaults have no actions; own categories have Renomear/Excluir >=48px', () => {
    renderIt()
    const rows = screen.getAllByRole('listitem')
    const def = rows.find((r) => r.textContent?.includes('Mercearia'))!
    expect(within(def).queryByRole('button')).toBeNull()
    const own = rows.find((r) => r.textContent?.includes('Pet'))!
    const rename = within(own).getByRole('button', { name: strings.categories.renameFor('Pet') })
    const del = within(own).getByRole('button', { name: strings.categories.deleteFor('Pet') })
    for (const b of [rename, del]) expect(b.className).toMatch(/min-h-12/)
    expect(rename).toHaveTextContent(strings.categories.rename)
    expect(del).toHaveTextContent(strings.categories.delete)
  })

  it.each(['', '   '])('AC2: blank name %j shows pt-BR error and skips addCategory', (value) => {
    renderIt()
    fireEvent.change(screen.getByLabelText(strings.categories.newLabel), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: strings.categories.add }))
    expect(screen.getByRole('alert')).toHaveTextContent(strings.categories.nameEmpty)
    expect(h.addCategory).not.toHaveBeenCalled()
  })

  it('creates, renames and deletes (with confirmation)', () => {
    renderIt()
    fireEvent.change(screen.getByLabelText(strings.categories.newLabel), {
      target: { value: ' Bebidas ' },
    })
    fireEvent.click(screen.getByRole('button', { name: strings.categories.add }))
    expect(h.addCategory).toHaveBeenCalledWith('f1', 'Bebidas', categories)

    fireEvent.click(screen.getByRole('button', { name: strings.categories.renameFor('Pet') }))
    fireEvent.change(screen.getByLabelText(strings.categories.renameLabel('Pet')), {
      target: { value: 'Pets' },
    })
    fireEvent.click(screen.getByRole('button', { name: strings.categories.save }))
    expect(h.renameCategory).toHaveBeenCalledWith('f1', 'c1', 'Pets')

    fireEvent.click(screen.getByRole('button', { name: strings.categories.deleteFor('Pet') }))
    expect(screen.getByText(strings.categories.confirmDelete('Pet'))).toBeInTheDocument()
    expect(h.deleteCategory).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: strings.categories.confirm }))
    expect(h.deleteCategory).toHaveBeenCalledWith('f1', 'c1')
  })
})
