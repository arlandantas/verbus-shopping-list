import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { Dialog } from './Dialog'

afterEach(async () => {
  cleanup()
  await new Promise((r) => setTimeout(r, 50))
})

describe('S-069: overlays survive StrictMode in dev', () => {
  const settle = () =>
    act(async () => {
      await new Promise((r) => setTimeout(r, 30))
    })
  beforeEach(() => history.pushState(null, ''))

  it('S-069 AC1: BottomSheet and Dialog stay open after effects and a pending popstate', async () => {
    const onSheet = vi.fn()
    const onDialog = vi.fn()
    const back = vi.spyOn(history, 'back')
    render(
      <StrictMode>
        <BottomSheet open title="Sheet" onClose={onSheet}>
          x
        </BottomSheet>
        <Dialog open title="Dialog" onClose={onDialog}>
          y
        </Dialog>
      </StrictMode>,
    )
    await settle()
    expect(back).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Sheet' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Dialog' })).toBeInTheDocument()
    expect(onSheet).not.toHaveBeenCalled()
    expect(onDialog).not.toHaveBeenCalled()
    back.mockRestore()
  })

  it('S-069 AC2: real back closes the top overlay; app close leaves no orphan entry', async () => {
    const base = history.length
    const onClose = vi.fn()
    function H() {
      const [open, setOpen] = useState(true)
      return (
        <BottomSheet
          open={open}
          title="T"
          onClose={() => {
            onClose()
            setOpen(false)
          }}
        >
          <button onClick={() => setOpen(false)}>fechar</button>
        </BottomSheet>
      )
    }
    render(
      <StrictMode>
        <H />
      </StrictMode>,
    )
    await settle()
    expect(history.state?.m3overlay).toBeGreaterThan(0)
    act(() => history.back())
    await settle()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(history.state?.m3overlay).toBeUndefined()
    cleanup()
    render(
      <StrictMode>
        <H />
      </StrictMode>,
    )
    await settle()
    fireEvent.click(screen.getByText('fechar'))
    await settle()
    expect(history.state?.m3overlay).toBeUndefined()
    expect(history.length).toBeLessThanOrEqual(base + 3)
  })

  it('S-070: Dialog stacked over BottomSheet under StrictMode; back closes only the Dialog', async () => {
    const onSheet = vi.fn()
    function Stack() {
      const [dialog, setDialog] = useState(false)
      return (
        <>
          <BottomSheet open title="Sheet" onClose={onSheet}>
            <button onClick={() => setDialog(true)}>abrir</button>
          </BottomSheet>
          <Dialog open={dialog} title="Dialog" onClose={() => setDialog(false)}>
            y
          </Dialog>
        </>
      )
    }
    render(
      <StrictMode>
        <Stack />
      </StrictMode>,
    )
    await settle()
    fireEvent.click(screen.getByText('abrir'))
    await settle()
    expect(screen.getByRole('dialog', { name: 'Sheet' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Dialog' })).toBeInTheDocument()
    act(() => history.back())
    await settle()
    expect(screen.queryByRole('dialog', { name: 'Dialog' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Sheet' })).toBeInTheDocument()
    expect(onSheet).not.toHaveBeenCalled()
  })
})
