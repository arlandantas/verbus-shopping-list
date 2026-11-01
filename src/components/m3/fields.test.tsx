import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { fireEvent, render, screen } from '@testing-library/react'
import { strings } from '@/strings/pt-BR'
import { TextField } from './TextField'
import { MoneyField } from './MoneyField'
import { Select } from './Select'
import { Checkbox } from './Checkbox'
import { Switch } from './Switch'

describe('S-054 AC1: TextField', () => {
  it('has label, helper, counter', () => {
    render(
      <TextField
        label="Nome"
        helper="Ajuda"
        maxLength={10}
        counter
        value="abc"
        onChange={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('Nome')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).toHaveAccessibleDescription('Ajuda')
    expect(screen.getByText('3/10')).toBeVisible()
  })
  it('error state is announced via describedby', () => {
    render(<TextField label="Nome" helper="Ajuda" error="Erro" value="" onChange={vi.fn()} />)
    const input = screen.getByLabelText('Nome')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Erro')
    expect(input).toHaveAccessibleDescription('Erro')
  })
})

describe('S-054 AC2: MoneyField', () => {
  const setup = (value: string, onChange = vi.fn(), onBlur = vi.fn()) => {
    render(
      <MoneyField
        label="Preço"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        invalidMessage="Inválido"
      />,
    )
    return { onChange, onBlur, input: screen.getByLabelText('Preço') }
  }
  it('shows R$ prefix and numeric keypad', () => {
    const { input } = setup('')
    expect(screen.getByText('R$')).toBeVisible()
    expect(input).toHaveAttribute('inputmode', 'numeric')
  })
  it.each([
    ['1', '0,01'],
    ['12', '0,12'],
    ['1290', '12,90'],
    ['123456', '1.234,56'],
    ['R$ 12,90', '12,90'],
    ['0', ''],
    ['10000000', '100.000,00'],
    ['100000001', '100.000,00'],
  ])('S-071 mask: typing %j reports %j', (typed, shown) => {
    const { input, onChange } = setup('')
    fireEvent.change(input, { target: { value: typed } })
    expect(onChange).toHaveBeenCalledWith(shown)
  })
  it('S-071: clearing the field reports empty', () => {
    const { input, onChange } = setup('1,29')
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith('')
  })
  it('S-071: initial value is shown as given', () => {
    const { input } = setup('12,90')
    expect(input).toHaveValue('12,90')
  })
  it.each(['12,90', '12.90', 'R$ 12,90', ''])('accepts %j without error', (v) => {
    setup(v)
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it.each(['12.90', 'R$ 12,90', '12,9'])('formats %j on blur to 12,90 or 12,90', (v) => {
    const { input, onChange, onBlur } = setup(v)
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(v === '12,9' ? '12,90' : '12,90')
    expect(onBlur).toHaveBeenCalled()
  })
  it('keeps empty as is on blur', () => {
    const { input, onChange } = setup('')
    fireEvent.blur(input)
    expect(onChange).not.toHaveBeenCalled()
  })
  it('shows error for invalid', () => {
    setup('abc')
    expect(screen.getByRole('alert')).toHaveTextContent('Inválido')
  })
})

describe('S-054 AC4: Select, Checkbox, Switch', () => {
  it('Select is labelled', () => {
    render(
      <Select label="Unidade" defaultValue="kg">
        <option value="kg">kg</option>
      </Select>,
    )
    expect(screen.getByLabelText('Unidade').tagName).toBe('SELECT')
  })
  it('Checkbox is native with check icon and 48px area', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Checkbox label="Recorrente" checked={false} onChange={onChange} />,
    )
    const cb = screen.getByRole('checkbox', { name: 'Recorrente' })
    fireEvent.click(cb)
    expect(onChange).toHaveBeenCalled()
    expect(container.querySelector('.m3-check__box svg')).not.toBeNull()
    const css = readFileSync('src/components/m3/fields.css', 'utf8')
    expect(css).toMatch(/\.m3-check__area \{[^}]*width: 48px;[^}]*height: 48px/)
  })
  it('Switch has role switch and aria-checked', () => {
    const { rerender } = render(<Switch label="Ativo" checked={false} onChange={vi.fn()} />)
    expect(screen.getByRole('switch', { name: 'Ativo' })).toHaveAttribute('aria-checked', 'false')
    rerender(<Switch label="Ativo" checked onChange={vi.fn()} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })
})

describe('S-054 AC5: no fixed text', () => {
  it('prefix comes from strings', () => {
    expect(strings.item.currencyPrefix).toBe('R$')
    const src = readFileSync('src/components/m3/MoneyField.tsx', 'utf8')
    expect(src).not.toMatch(/>\s*R\$\s*</)
  })
})
