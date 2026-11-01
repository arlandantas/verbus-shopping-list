import { Link } from 'react-router'
import { strings } from '@/strings/pt-BR'

/** Primary "Finalizar compra" action; callers render it only when something is bought. */
export function CheckoutLink() {
  return (
    <Link
      to="/finalizar"
      className="flex min-h-12 items-center justify-center rounded bg-green-700 px-4 text-base font-medium text-white"
    >
      {strings.checkout.link}
    </Link>
  )
}
