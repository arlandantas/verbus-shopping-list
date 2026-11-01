import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { BackButton } from '@/components/BackButton'
import { Button } from '@/components/m3/Button'
import { Chip } from '@/components/m3/Chip'
import { Icon } from '@/components/m3/Icon'
import { ListItem } from '@/components/m3/ListItem'
import { MoneyField } from '@/components/m3/MoneyField'
import { TextField } from '@/components/m3/TextField'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { checkout } from '@/data/checkout'
import { setItemPrice } from '@/data/items'
import { usePurchases } from '@/hooks/useHistory'
import { useCategories } from '@/hooks/useCategories'
import { knownMarkets } from '@/domain/history'
import { formatQuantity } from '@/domain/itemText'
import { formatBRL, parsePriceBRL } from '@/domain/price'
import { useItems } from '@/screens/List/useItems'
import { strings } from '@/strings/pt-BR'
import './checkout.css'

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
  const text = (id: string, cents: number | null) =>
    edits[id] ?? (cents == null ? '' : formatBRL(cents).replace(/^R\$\s*/, ''))
  const parsed = bought.map((i) => parsePriceBRL(text(i.id, i.priceCents)))
  const allValid = parsed.every((p) => p.ok)
  const total = parsed.reduce((sum, p) => sum + (p.ok ? (p.cents ?? 0) : 0), 0)
  const markets = knownMarkets(purchases ?? [])

  const onFinish = () => {
    checkout(
      familyId,
      bought.map((i, n) => {
        const p = parsed[n]!
        return { ...i, priceCents: p.ok ? p.cents : i.priceCents }
      }),
      { market: market.trim() || null, categories: categories ?? [] },
    )
    void navigate('/', { replace: true })
  }

  return (
    <main className="checkout">
      <TopAppBar title={strings.checkout.title} navigation={<BackButton to="/" />} />
      <div className="checkout__body">
        <p className="checkout__summary">{strings.checkout.summary(bought.length)}</p>
        <TextField
          label={strings.checkout.marketLabel}
          helper={strings.checkout.marketHelper}
          prefix={<Icon name="storefront" />}
          value={market}
          maxLength={60}
          onChange={(e) => setMarket(e.target.value)}
        />
        {markets.length > 0 && (
          <ul className="m3-chips" aria-label={strings.checkout.marketSuggestions}>
            {markets.map((m) => (
              <li key={m}>
                <Chip onClick={() => setMarket(m)}>{m}</Chip>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="checkout__lines">
        {bought.map((i) => (
          <ListItem
            key={i.id}
            headline={i.name}
            supporting={formatQuantity(i.quantity, i.unit)}
            trailing={
              <div className="checkout__money">
                <MoneyField
                  label={strings.checkout.priceFor(i.name)}
                  value={text(i.id, i.priceCents)}
                  onChange={(v) => setEdits((e) => ({ ...e, [i.id]: v }))}
                  onBlur={() => {
                    const p = parsePriceBRL(text(i.id, i.priceCents))
                    if (p.ok && p.cents !== i.priceCents) setItemPrice(familyId, i.id, p.cents)
                  }}
                />
              </div>
            }
          />
        ))}
      </ul>
      <div className="checkout__footer">
        <p className="checkout__total">{strings.checkout.total(formatBRL(total))}</p>
        <Button disabled={!allValid} onClick={onFinish}>
          {strings.checkout.finish}
        </Button>
      </div>
    </main>
  )
}
