import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { reportWriteError } from '@/data/writeErrors'
import { strings } from '@/strings/pt-BR'
import { WriteErrorNotice } from './WriteErrorNotice'

describe('ADR-0004: WriteErrorNotice', () => {
  it('shows nothing until a write error is reported', () => {
    render(<WriteErrorNotice />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows a pt-BR alert when a write or snapshot error is reported, and can be dismissed', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<WriteErrorNotice />)
    act(() => reportWriteError(new Error('permission-denied')))
    expect(screen.getByRole('alert')).toHaveTextContent(strings.writeError)
    fireEvent.click(screen.getByRole('button', { name: strings.dismiss }))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('restores the default handler on unmount', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<WriteErrorNotice />).unmount()
    reportWriteError(new Error('x'))
    expect(spy).toHaveBeenCalled()
  })

  it('S-072 AC3: stacks above the add-bar zone', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<WriteErrorNotice />)
    act(() => reportWriteError(new Error('x')))
    expect(screen.getByRole('alert').className).toContain('var(--add-bar-zone,0px)')
  })
})
