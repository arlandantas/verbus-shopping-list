import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AddItemBar } from './AddItemBar'
import { strings } from '@/strings/pt-BR'

describe('S-019 AC2: AddItemBar', () => {
  it('disables Adicionar for blank text and does not submit', () => {
    const onAdd = vi.fn()
    render(<AddItemBar onAdd={onAdd} />)
    const input = screen.getByLabelText(strings.list.addLabel)
    expect(screen.getByRole('button', { name: strings.list.add })).toBeDisabled()
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(input.closest('form')!)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('S-019 AC1: submits trimmed text and clears the field', () => {
    const onAdd = vi.fn()
    render(<AddItemBar onAdd={onAdd} />)
    const input = screen.getByLabelText(strings.list.addLabel) as HTMLInputElement
    fireEvent.change(input, { target: { value: ' 3 kg feijão ' } })
    fireEvent.submit(input.closest('form')!)
    expect(onAdd).toHaveBeenCalledWith('3 kg feijão')
    expect(input.value).toBe('')
  })
})

describe('AddItemBar combobox (ADR-0009)', () => {
  const entry = (name: string, nameKey: string) => ({
    name,
    nameKey,
    quantity: 2,
    unit: 'kg' as const,
    categoryId: null,
    recurring: false,
    lastUsedAt: new Date(2026, 9, 1),
  })
  const catalog = [entry('feijão', 'feijao'), entry('feijão preto', 'feijao preto')]

  function setup() {
    const onAdd = vi.fn()
    const onPick = vi.fn()
    render(<AddItemBar onAdd={onAdd} onPick={onPick} catalog={catalog} />)
    const input = screen.getByLabelText(strings.list.addLabel)
    return { input, onAdd, onPick }
  }

  it('exposes combobox semantics and tracks the active option with the arrow keys', () => {
    const { input } = setup()
    expect(input).toHaveAttribute('role', 'combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    fireEvent.change(input, { target: { value: 'fei' } })
    const list = screen.getByRole('listbox')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls', list.id)
    expect(input).not.toHaveAttribute('aria-activedescendant')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const options = screen.getAllByRole('option')
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id)
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
  })

  it('Enter picks the active suggestion instead of adding the typed text', () => {
    const { input, onAdd, onPick } = setup()
    fireEvent.change(input, { target: { value: 'fei' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onPick).toHaveBeenCalledWith(catalog[1], null)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('Escape closes the list and collapses aria-expanded', () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'fei' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('S-060 AC1/AC2: bottom bar', () => {
  it('S-060 AC1: M3 field with placeholder "Adicionar item" and a filled add icon button', () => {
    render(<AddItemBar onAdd={vi.fn()} />)
    const input = screen.getByLabelText(strings.list.addLabel)
    expect(input).toHaveAttribute('placeholder', 'Adicionar item')
    expect(input.closest('.m3-field')).not.toBeNull()
    const btn = screen.getByRole('button', { name: 'Adicionar' })
    expect(btn).toHaveClass('m3-icon-btn--filled')
    expect(btn).toBeDisabled()
    fireEvent.change(input, { target: { value: 'leite' } })
    expect(btn).toBeEnabled()
  })

  it('S-060 AC2: suggestions open upward with own scroll and show "feijão · 2 kg"', () => {
    const catalog = [
      {
        name: 'feijão',
        nameKey: 'feijao',
        quantity: 2,
        unit: 'kg' as const,
        categoryId: null,
        recurring: false,
        lastUsedAt: new Date(2026, 9, 1),
      },
    ]
    render(<AddItemBar onAdd={vi.fn()} catalog={catalog} />)
    fireEvent.change(screen.getByLabelText(strings.list.addLabel), { target: { value: 'fei' } })
    const list = screen.getByRole('listbox')
    expect(list).toHaveClass('bottom-full')
    expect(list).not.toHaveClass('top-full')
    expect(list).toHaveClass('overflow-y-auto')
    expect(list.className).toMatch(/max-h-\[40vh\]/)
    expect(screen.getByRole('option', { name: 'feijão · 2 kg' })).toBeInTheDocument()
  })
})
