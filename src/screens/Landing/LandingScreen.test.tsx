import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { strings } from '@/strings/pt-BR'
import { LandingScreen } from './LandingScreen'
import { parseInvite } from './parseInvite'

const t = strings.landing

function Where() {
  return <p>at:{useLocation().pathname}</p>
}

function setup() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('parseInvite', () => {
  it('accepts a bare code in any case, with separators', () => {
    expect(parseInvite(' abcd-2345 ')).toBe('ABCD2345')
  })
  it('extracts the code from a pasted link', () => {
    expect(parseInvite('https://nossocarrinho.web.app/convite/ABCD2345')).toBe('ABCD2345')
  })
  it('rejects garbage and codes with forbidden characters', () => {
    expect(parseInvite('oi')).toBeNull()
    expect(parseInvite('ABCD0O1I')).toBeNull()
  })
})

describe('LandingScreen', () => {
  it('S-109 AC1: shows the intro text without mentioning Não pode faltar', () => {
    setup()
    const lead = screen.getByText(t.heroSubtitle)
    expect(lead.textContent).toMatch(/sem internet/i)
    expect(lead.textContent).not.toMatch(/não pode faltar/i)
  })

  it('primary CTA goes to /entrar', () => {
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: t.createAccount })[0])
    expect(screen.getByText('at:/entrar')).toBeInTheDocument()
  })

  it('secondary CTA reveals the invite form and navigates to the invite', () => {
    setup()
    expect(screen.queryByLabelText(t.inviteLabel)).toBeNull()
    fireEvent.click(screen.getAllByRole('button', { name: t.haveInvite })[0])
    fireEvent.change(screen.getByLabelText(t.inviteLabel), { target: { value: 'abcd2345' } })
    fireEvent.click(screen.getByRole('button', { name: t.inviteContinue }))
    expect(screen.getByText('at:/convite/ABCD2345')).toBeInTheDocument()
  })

  it('shows an error for an invalid invite and stays on the page', () => {
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: t.haveInvite })[0])
    fireEvent.change(screen.getByLabelText(t.inviteLabel), { target: { value: 'xx' } })
    fireEvent.click(screen.getByRole('button', { name: t.inviteContinue }))
    expect(screen.getByText(t.inviteInvalid)).toBeInTheDocument()
  })
})
