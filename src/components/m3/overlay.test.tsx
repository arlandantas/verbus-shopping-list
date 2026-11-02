import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { Dialog } from './Dialog'
import { Snackbar } from './Snackbar'

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>abrir</button>
      <BottomSheet
        open={open}
        title="Editar"
        onClose={() => {
          onClose()
          setOpen(false)
        }}
      >
        <input aria-label="campo" />
        <button>ok</button>
      </BottomSheet>
    </>
  )
}

describe('S-055 AC1: BottomSheet semantics', () => {
  it('renders modal dialog labelled by title', () => {
    render(
      <BottomSheet open title="Editar" onClose={vi.fn()}>
        <input aria-label="campo" />
      </BottomSheet>,
    )
    const d = screen.getByRole('dialog', { name: 'Editar' })
    expect(d).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByTestId('scrim')).toBeInTheDocument()
    const css = readFileSync('src/components/m3/overlay.css', 'utf8')
    expect(css).toContain('max-height: 90vh')
    expect(css).toContain('corner-xl) var(--md-sys-shape-corner-xl) 0 0')
  })
  it('renders nothing when closed', () => {
    render(
      <BottomSheet open={false} title="X" onClose={vi.fn()}>
        a
      </BottomSheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('S-055 AC2: close and focus', () => {
  it('closes by Esc, scrim and close icon', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="T" onClose={onClose}>
        <input aria-label="campo" />
      </BottomSheet>,
    )
    fireEvent.keyDown(screen.getByLabelText('campo'), { key: 'Escape' })
    fireEvent.click(screen.getByTestId('scrim'))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })
  it('focuses first field, traps Tab, restores focus', () => {
    render(<Harness />)
    const opener = screen.getByText('abrir')
    opener.focus()
    fireEvent.click(opener)
    const field = screen.getByLabelText('campo')
    expect(field).toHaveFocus()
    screen.getByText('ok').focus()
    fireEvent.keyDown(screen.getByText('ok'), { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Fechar' }), {
      key: 'Tab',
      shiftKey: true,
    })
    expect(screen.getByText('ok')).toHaveFocus()
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(opener).toHaveFocus()
  })
})

describe('S-055 AC3: history back', () => {
  it('pushes a state and closes on popstate', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="T" onClose={onClose}>
        x
      </BottomSheet>,
    )
    expect(history.state).toMatchObject({ m3overlay: expect.any(Number) })
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('closing via app consumes the pushed state', async () => {
    const back = vi.spyOn(history, 'back')
    const { rerender } = render(
      <BottomSheet open title="T" onClose={vi.fn()}>
        x
      </BottomSheet>,
    )
    rerender(
      <BottomSheet open={false} title="T" onClose={vi.fn()}>
        x
      </BottomSheet>,
    )
    await act(async () => {})
    expect(back).toHaveBeenCalledTimes(1)
    back.mockRestore()
  })
})

describe('S-055 AC4: Dialog', () => {
  it('has title, scrollable content, actions', () => {
    render(
      <Dialog open title="Título" onClose={vi.fn()} actions={<button>Fazer</button>}>
        corpo
      </Dialog>,
    )
    expect(screen.getByRole('dialog', { name: 'Título' })).toBeInTheDocument()
    expect(screen.getByText('corpo')).toBeInTheDocument()
    expect(screen.getByText('Fazer')).toBeInTheDocument()
    expect(readFileSync('src/components/m3/overlay.css', 'utf8')).toContain('overflow-y: auto')
  })
  it('confirm variant uses labels, Esc closes', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <Dialog
        open
        variant="confirm"
        title="Excluir?"
        confirmLabel="Excluir"
        cancelLabel="Manter"
        onClose={onClose}
        onConfirm={onConfirm}
      >
        certeza
      </Dialog>,
    )
    fireEvent.click(screen.getByText('Excluir'))
    expect(onConfirm).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Manter'))
    fireEvent.keyDown(screen.getByText('Manter'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('S-055 AC5: scroll lock', () => {
  it('locks body overflow and restores', () => {
    const { rerender } = render(
      <BottomSheet open title="T" onClose={vi.fn()}>
        x
      </BottomSheet>,
    )
    expect(document.body.style.overflow).toBe('hidden')
    rerender(
      <BottomSheet open={false} title="T" onClose={vi.fn()}>
        x
      </BottomSheet>,
    )
    expect(document.body.style.overflow).toBe('')
  })
})

describe('S-055 AC6: Snackbar', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('is a polite status region, dismisses after duration', () => {
    const onDismiss = vi.fn()
    render(<Snackbar message="Oi" onDismiss={onDismiss} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    act(() => void vi.advanceTimersByTime(3999))
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => void vi.advanceTimersByTime(1))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
  it('action calls onAction then onDismiss once', () => {
    const calls: string[] = []
    render(
      <Snackbar
        message="Oi"
        actionLabel="Desfazer"
        onAction={() => calls.push('a')}
        onDismiss={() => calls.push('d')}
      />,
    )
    fireEvent.click(screen.getByText('Desfazer'))
    expect(calls).toEqual(['a', 'd'])
  })
  it('uses inverse colors', () => {
    const css = readFileSync('src/components/m3/overlay.css', 'utf8')
    expect(css).toContain('--md-sys-color-inverse-surface')
    expect(css).toContain('--md-sys-color-inverse-on-surface')
    expect(css).toContain('--md-sys-color-inverse-primary')
  })
})

describe('S-055 AC7: replacement and offset', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('new message restarts timer; only one snackbar', () => {
    const onDismiss = vi.fn()
    const { rerender } = render(<Snackbar message="A" onDismiss={onDismiss} />)
    act(() => void vi.advanceTimersByTime(3000))
    rerender(<Snackbar message="B" onDismiss={onDismiss} />)
    act(() => void vi.advanceTimersByTime(3000))
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.queryByText('A')).toBeNull()
    act(() => void vi.advanceTimersByTime(1000))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
  it('positions with --snackbar-offset', () => {
    expect(readFileSync('src/components/m3/overlay.css', 'utf8')).toContain(
      'bottom: var(--snackbar-offset',
    )
  })
})

describe('S-055 review fixes', () => {
  it('S-055 AC3: open/close repeatedly balances history', async () => {
    const back = vi.spyOn(history, 'back')
    for (let i = 0; i < 3; i++) {
      const { unmount } = render(
        <BottomSheet open title="T" onClose={vi.fn()}>
          x
        </BottomSheet>,
      )
      unmount()
      await act(async () => {})
    }
    expect(back).toHaveBeenCalledTimes(3)
    back.mockRestore()
  })
  it('S-055 AC3: StrictMode push/back/push does not close the overlay', async () => {
    const onClose = vi.fn()
    render(
      <StrictMode>
        <BottomSheet open title="T" onClose={onClose}>
          x
        </BottomSheet>
      </StrictMode>,
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('S-055 AC3: close via back does not call history.back again', () => {
    const back = vi.spyOn(history, 'back')
    const onClose = vi.fn()
    const { rerender } = render(
      <BottomSheet open title="T" onClose={onClose}>
        x
      </BottomSheet>,
    )
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    rerender(
      <BottomSheet open={false} title="T" onClose={onClose}>
        x
      </BottomSheet>,
    )
    expect(back).not.toHaveBeenCalled()
    back.mockRestore()
  })
  it('S-055 AC4: Esc works in Dialog without focusable content', () => {
    const onClose = vi.fn()
    render(
      <Dialog open title="T" onClose={onClose}>
        texto
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toHaveFocus()
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('S-055 AC6: action then timeout calls onDismiss once', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Snackbar message="Oi" actionLabel="Desfazer" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByText('Desfazer'))
    act(() => void vi.advanceTimersByTime(10000))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

afterEach(async () => {
  cleanup()
  await new Promise((r) => setTimeout(r, 50))
})

describe('S-057 review: overlay history stack', () => {
  // earlier tests leave overlay entries behind; start from a clean entry
  beforeEach(() => history.pushState(null, ''))
  const settle = () =>
    act(async () => {
      await new Promise((r) => setTimeout(r, 30))
    })

  function Stacked({ onSheet, onDialog }: { onSheet: () => void; onDialog: () => void }) {
    const [sheet, setSheet] = useState(true)
    const [dialog, setDialog] = useState(false)
    return (
      <>
        <button onClick={() => setDialog(true)}>abrir dialog</button>
        <button
          onClick={() => {
            setDialog(false)
            setSheet(false)
          }}
        >
          fechar tudo
        </button>
        <BottomSheet
          open={sheet}
          title="Sheet"
          onClose={() => {
            onSheet()
            setSheet(false)
          }}
        >
          x
        </BottomSheet>
        <Dialog
          open={dialog}
          title="Dialog"
          onClose={() => {
            onDialog()
            setDialog(false)
          }}
        >
          y
        </Dialog>
      </>
    )
  }

  it('Android back with a Dialog over a Sheet closes only the Dialog', async () => {
    const onSheet = vi.fn()
    const onDialog = vi.fn()
    render(<Stacked onSheet={onSheet} onDialog={onDialog} />)
    await settle()
    fireEvent.click(screen.getByText('abrir dialog'))
    await settle()
    act(() => history.back())
    await settle()
    expect(onDialog).toHaveBeenCalledTimes(1)
    expect(onSheet).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Sheet' })).toBeInTheDocument()
    act(() => history.back())
    await settle()
    expect(onSheet).toHaveBeenCalledTimes(1)
  })

  it('closing both at once (item vanished) leaves no orphan entry and back is not dead', async () => {
    const onSheet = vi.fn()
    const onDialog = vi.fn()
    render(<Stacked onSheet={onSheet} onDialog={onDialog} />)
    await settle()
    fireEvent.click(screen.getByText('abrir dialog'))
    await settle()
    expect(history.state?.m3overlay).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('fechar tudo'))
    await settle()
    expect(history.state?.m3overlay).toBeUndefined()
    expect(onSheet).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
    // a later overlay still closes with back
    const onClose = vi.fn()
    render(
      <BottomSheet open title="Outro" onClose={onClose}>
        z
      </BottomSheet>,
    )
    await settle()
    act(() => history.back())
    await settle()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closing the parent closes the children and unwinds every entry', async () => {
    const onDialog = vi.fn()
    render(<Stacked onSheet={vi.fn()} onDialog={onDialog} />)
    await settle()
    fireEvent.click(screen.getByText('abrir dialog'))
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    await settle()
    expect(onDialog).toHaveBeenCalledTimes(1)
    expect(history.state?.m3overlay).toBeUndefined()
  })
})

describe('S-104 AC1: stacked overlays restore body scroll in any close order', () => {
  it.each([
    ['inner first', true],
    ['outer first', false],
  ])('%s', (_, innerFirst) => {
    document.body.style.overflow = ''
    const two = (a: boolean, b: boolean) => (
      <>
        <BottomSheet open={a} title="A" onClose={vi.fn()}>
          x
        </BottomSheet>
        <Dialog open={b} title="B" onClose={vi.fn()}>
          y
        </Dialog>
      </>
    )
    const { rerender } = render(two(true, true))
    expect(document.body.style.overflow).toBe('hidden')
    rerender(innerFirst ? two(true, false) : two(false, true))
    expect(document.body.style.overflow).toBe('hidden')
    rerender(two(false, false))
    expect(document.body.style.overflow).toBe('')
  })
})
