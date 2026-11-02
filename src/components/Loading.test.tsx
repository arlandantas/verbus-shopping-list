import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import { strings } from '@/strings/pt-BR'
import { Loading } from './Loading'

describe('Loading', () => {
  afterEach(() => vi.useRealTimers())

  it('never loads forever: shows a pt-BR error with retry after the timeout', () => {
    vi.useFakeTimers()
    render(<Loading timeoutMs={1000} />)
    expect(screen.getByText(strings.loading)).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByRole('alert')).toHaveTextContent(strings.loadTimeout)
    expect(screen.getByRole('button', { name: strings.retry })).toBeInTheDocument()
  })

  it('S-102 AC2: shows icon, status indicator and text', () => {
    const { container } = render(<Loading />)
    expect(screen.getByRole('status')).toHaveTextContent(strings.loading)
    expect(container.querySelector('img[src="/icons/icon-192.png"]')).not.toBeNull()
  })
})
