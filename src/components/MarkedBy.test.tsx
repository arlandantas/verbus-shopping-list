import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MarkedBy } from './MarkedBy'

const names = { u1: 'Ana', u2: 'Beto' }

describe('S-029 AC1: MarkedBy', () => {
  it('shows "por você" for the current user', () => {
    render(<MarkedBy status="bought" markedBy="u1" names={names} uid="u1" />)
    expect(screen.getByText('por você')).toBeInTheDocument()
  })
  it('shows "por Ana" for another member', () => {
    render(<MarkedBy status="bought" markedBy="u1" names={names} uid="u2" />)
    expect(screen.getByText('por Ana')).toBeInTheDocument()
  })
  it('shows "por alguém" when the uid has no profile', () => {
    render(<MarkedBy status="bought" markedBy="u9" names={names} uid="u2" />)
    expect(screen.getByText('por alguém')).toBeInTheDocument()
  })
  it('S-029 AC1: renders nothing while member names are loading', () => {
    const { container } = render(<MarkedBy status="bought" markedBy="u1" names={null} uid="u2" />)
    expect(container).toBeEmptyDOMElement()
  })
  it('renders nothing for a pending item', () => {
    const { container } = render(
      <MarkedBy status="pending" markedBy={null} names={names} uid="u1" />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
