import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Category } from '@/data/converters'
import { icons } from '@/components/m3/icons'
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

const t = strings.categories

describe('S-062 CategoriesScreen', () => {
  it('AC1: back + title, user section before default section', () => {
    renderIt()
    expect(screen.getByRole('heading', { level: 1, name: t.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.back })).toBeInTheDocument()
    const user = screen.getByRole('heading', { name: t.userSection })
    const def = screen.getByRole('heading', { name: t.defaultSection })
    expect(user.compareDocumentPosition(def) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const lists = screen.getAllByRole('list')
    expect(within(lists[0]).getByText('Pet')).toBeInTheDocument()
    expect(within(lists[1]).getByText('Mercearia')).toBeInTheDocument()
  })

  it('AC2: own rows have edit/delete; rename and delete use dialogs', () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: t.renameFor('Pet') }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(t.renameLabel('Pet')), { target: { value: 'Pets' } })
    fireEvent.click(screen.getByRole('button', { name: t.save }))
    expect(h.renameCategory).toHaveBeenCalledWith('f1', 'c1', 'Pets')

    fireEvent.click(screen.getByRole('button', { name: t.deleteFor('Pet') }))
    expect(screen.getByRole('dialog', { name: t.confirmDelete('Pet') })).toBeInTheDocument()
    expect(h.deleteCategory).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: t.confirm }))
    expect(h.deleteCategory).toHaveBeenCalledWith('f1', 'c1')
  })

  it('AC3: defaults are locked, muted, with no actions and an explicit accessible name', () => {
    renderIt()
    const def = screen.getByRole('listitem', { name: t.defaultLocked('Mercearia') })
    expect(within(def).queryByRole('button')).toBeNull()
    expect(def.querySelector('svg path')?.getAttribute('d')).toBe(icons.lock)
    expect(def.className).toMatch(/m3-list-item--muted/)
  })

  it('AC4: empty user section keeps "Nova categoria"; create validates 1-40', () => {
    categories = [cat('mercearia', 'Mercearia', true, 0)]
    renderIt()
    expect(screen.getByText(t.emptyUser)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t.newLabel }))
    const field = screen.getByLabelText(t.nameLabel)
    expect(field).toHaveAttribute('maxlength', '40')
    fireEvent.change(field, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: t.save }))
    expect(screen.getByRole('alert')).toHaveTextContent(t.nameEmpty)
    expect(h.addCategory).not.toHaveBeenCalled()
    fireEvent.change(field, { target: { value: ' Bebidas ' } })
    fireEvent.click(screen.getByRole('button', { name: t.save }))
    expect(h.addCategory).toHaveBeenCalledWith('f1', 'Bebidas', categories)
  })
})
