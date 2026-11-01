import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { Icon } from './Icon'
import { icons } from './icons'

describe('Icon', () => {
  it('S-051 AC3: renders a 24x24 decorative svg using currentColor', () => {
    const { container } = render(<Icon name="arrow_back" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('fill', 'currentColor')
  })

  it('S-051 AC3: accepts size', () => {
    const { container } = render(<Icon name="close" size={40} />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '40')
  })

  it('S-051 AC4: registry contains the required icons', () => {
    const required =
      `arrow_back close edit delete logout add share content_copy info lock expand_less expand_more checklist kitchen history group shopping_cart shopping_cart_checkout check visibility_off category storefront remove_shopping_cart`.split(
        ' ',
      )
    for (const n of required) expect(icons).toHaveProperty(n)
  })
})
