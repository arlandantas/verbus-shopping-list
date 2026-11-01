import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { strings } from '@/strings/pt-BR'
import { PriceInput } from './PriceInput'

describe('S-045 AC1: PriceInput', () => {
  it('is a labelled decimal input', () => {
    render(<PriceInput value="" onChange={vi.fn()} />)
    const el = screen.getByLabelText(strings.item.price)
    expect(el).toHaveAttribute('inputmode', 'decimal')
  })

  it('reports typed text and shows no error for valid or empty values', () => {
    const onChange = vi.fn()
    const { rerender } = render(<PriceInput value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(strings.item.price), { target: { value: '18,90' } })
    expect(onChange).toHaveBeenCalledWith('18,90')
    for (const v of ['', '18,90', 'R$ 12.90']) {
      rerender(<PriceInput value={v} onChange={onChange} />)
      expect(screen.queryByRole('alert')).toBeNull()
    }
  })

  it('shows the pt-BR error for an invalid value', () => {
    render(<PriceInput value="abc" onChange={vi.fn()} />)
    expect(screen.getByText(strings.item.priceInvalid)).toBeVisible()
    expect(screen.getByLabelText(strings.item.price)).toHaveAttribute('aria-invalid', 'true')
  })
})
