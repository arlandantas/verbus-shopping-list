import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { BackButton } from '@/components/BackButton'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { MoneyField } from '@/components/m3/MoneyField'
import { checkout } from '@/data/checkout'
import { setItemPrice } from '@/data/items'
import { usePurchases } from '@/hooks/useHistory'
import { useCategories } from '@/hooks/useCategories'
import { knownMarkets } from '@/domain/history'
import { formatBRL, parsePriceBRL } from '@/domain/price'
import { useItems } from '@/screens/List/useItems'
import { strings } from '@/strings/pt-BR'

export function CheckoutScreen() {
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const categories = useCategories(family?.id)
  const purchases = usePurchases(family?.id)
  const navigate = useNavigate()
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [market, setMarket] = useState('')
  if (!family || !items) return null

  const bought = items.filter((i) => i.status === 'bought')
  if (bought.length === 0) return <Navigate to="/" replace />
  const pending = items.length - bought.length
  const text = (id: string, cents: number | null) =>
    edits[id] ?? (cents == null ? '' : formatBRL(cents).replace(/^R\$\s*/, ''))
  /** Typed price if valid, else the stored one: a typo never blocks finishing. */
  const priceOf = (id: string, cents: number | null) => {
    const parsed = parsePriceBRL(text(id, cents))
    return parsed.ok ? parsed.cents : cents
  }

  const onFinish = () => {
    checkout(
      familyId,
      bought.map((i) => ({ ...i, priceCents: priceOf(i.id, i.priceCents) })),
      { market: market.trim() || null, categories: categories ?? [] },
    )
    void navigate('/', { replace: true })
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 pb-8">
      <TopAppBar title={strings.checkout.title} navigation={<BackButton to="/" />} />
      <p>{strings.checkout.summary(bought.length, pending)}</p>
      <label className="flex flex-col gap-1">
        {strings.checkout.marketLabel}
        <input
          type="text"
          list="known-markets"
          value={market}
          maxLength={60}
          onChange={(e) => setMarket(e.target.value)}
          className="min-h-12 w-full rounded border border-gray-400 px-3 text-base"
        />
      </label>
      <datalist id="known-markets">
        {knownMarkets(purchases ?? []).map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <section aria-label={strings.checkout.pricesTitle} className="flex flex-col gap-3">
        <h2 className="text-lg">{strings.checkout.pricesTitle}</h2>
        <ul className="flex flex-col gap-3">
          {bought.map((i) => (
            <li key={i.id}>
              <MoneyField
                invalidMessage={strings.item.priceInvalid}
                label={strings.checkout.priceFor(i.name)}
                value={text(i.id, i.priceCents)}
                onChange={(v) => setEdits((e) => ({ ...e, [i.id]: v }))}
                onBlur={() => {
                  const parsed = parsePriceBRL(text(i.id, i.priceCents))
                  if (parsed.ok && parsed.cents !== i.priceCents)
                    setItemPrice(familyId, i.id, parsed.cents)
                }}
              />
            </li>
          ))}
        </ul>
      </section>
      <button
        type="button"
        onClick={onFinish}
        className="min-h-14 w-full rounded bg-green-700 px-4 text-lg font-medium text-white"
      >
        {strings.checkout.finish}
      </button>
    </main>
  )
}
