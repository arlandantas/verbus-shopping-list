import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { TopAppBar } from './TopAppBar'
import { NavigationBar } from './NavigationBar'

const css = readFileSync('src/components/m3/m3.css', 'utf8')

describe('Button', () => {
  it('S-052 AC1: variants, optional left icon, disabled', () => {
    for (const v of ['filled', 'tonal', 'outlined', 'text'] as const) {
      const { unmount } = render(<Button variant={v}>X</Button>)
      expect(screen.getByRole('button')).toHaveClass(`m3-btn--${v}`)
      unmount()
    }
    const { container } = render(
      <Button icon="add" disabled>
        Novo
      </Button>,
    )
    const b = screen.getByRole('button', { name: 'Novo' })
    expect(b).toBeDisabled()
    expect(b.firstElementChild).toBe(container.querySelector('svg'))
    expect(css).toMatch(/\.m3-btn\s*\{[^}]*height: 40px/)
    expect(css).toMatch(/\.m3-btn::after\s*\{[^}]*inset-block: -4px/)
  })
})

describe('Button padding', () => {
  it('S-053: has-icon start padding is declared after --text so it is not overridden', () => {
    expect(css.indexOf('.m3-btn--has-icon {')).toBeGreaterThan(css.indexOf('.m3-btn--text {'))
    expect(css).toMatch(/\.m3-btn--text\.m3-btn--has-icon\s*\{[^}]*padding-inline-start: 12px/)
  })
})

describe('IconButton', () => {
  it('S-052 AC2: label, variant, selected, 48px', () => {
    render(<IconButton icon="close" label="Fechar" variant="tonal" selected />)
    const b = screen.getByRole('button', { name: 'Fechar' })
    expect(b).toHaveAttribute('aria-pressed', 'true')
    expect(b).toHaveClass('m3-icon-btn--tonal')
    expect(css).toMatch(/\.m3-icon-btn\s*\{[^}]*width: 48px;[^}]*height: 48px/)
  })

  it('S-052 AC2: no aria-pressed when not toggle', () => {
    render(<IconButton icon="close" label="Fechar" />)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')
  })
})

describe('TopAppBar', () => {
  it('S-052 AC3: h1, slots, subtitle', () => {
    render(
      <TopAppBar
        title="Lista"
        subtitle="3 itens"
        navigation={<button>voltar</button>}
        actions={<button>mais</button>}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Lista' })).toBeInTheDocument()
    expect(screen.getByText('3 itens')).toBeInTheDocument()
    expect(screen.getByText('voltar')).toBeInTheDocument()
    expect(screen.getByText('mais')).toBeInTheDocument()
  })
})

describe('NavigationBar', () => {
  it('S-052 AC4: nav, links, aria-current, 80px, safe area', () => {
    render(
      <MemoryRouter initialEntries={['/b']}>
        <NavigationBar
          label="Principal"
          destinations={[
            { to: '/a', label: 'A', icon: 'checklist' },
            { to: '/b', label: 'B', icon: 'kitchen' },
          ]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'A' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'A' }).querySelector('svg')).not.toBeNull()
    expect(css).toMatch(/\.m3-nav\s*\{[^}]*height: 80px/)
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toMatch(/aria-current='page'\] \.m3-nav__pill\s*\{[^}]*secondary-container/)
  })
})

describe('NavigationBar also', () => {
  it('S-053 AC1: sub-route prefixes keep the destination active', () => {
    render(
      <MemoryRouter initialEntries={['/x/1']}>
        <NavigationBar
          label="P"
          destinations={[{ to: '/a', label: 'A', icon: 'group', also: ['/x'] }]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('focus', () => {
  it('S-052 AC5: focus-visible outline on all interactive components', () => {
    const rule = css.match(/\.m3-btn:focus-visible,[^{]*\{[^}]*\}/)![0]
    expect(rule).toContain('.m3-icon-btn:focus-visible')
    expect(rule).toContain('.m3-nav__item:focus-visible')
    expect(rule).toContain('outline: 3px solid')
  })
})
