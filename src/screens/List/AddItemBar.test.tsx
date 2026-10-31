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
