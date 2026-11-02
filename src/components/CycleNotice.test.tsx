import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CycleNotice } from './CycleNotice'

describe('S-049 AC1: CycleNotice', () => {
  it('shows the singular message with role=status', () => {
    render(<CycleNotice added={1} onDismiss={() => undefined} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 item que não pode faltar voltou para a lista',
    )
  })

  it('shows the plural message', () => {
    render(<CycleNotice added={3} onDismiss={() => undefined} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      '3 itens que não podem faltar voltaram para a lista',
    )
  })

  it('renders nothing when nothing was added', () => {
    render(<CycleNotice added={0} onDismiss={() => undefined} />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('calls onDismiss when tapping OK', () => {
    const onDismiss = vi.fn()
    render(<CycleNotice added={2} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
