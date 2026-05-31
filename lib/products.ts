export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
}

export const PRODUCTS: Product[] = [
  {
    id: 'website-deposit',
    name: 'Website Design Deposit',
    description: '$499 deposit. Balance of $499 due upon site completion.',
    priceInCents: 49900, // $499.00
  },
  {
    id: 'website-full',
    name: 'Website Design - Pay in Full',
    description: 'Complete payment for your custom website. No balance due.',
    priceInCents: 99800, // $998.00
  },
]

export const DEPOSIT_PRODUCT = PRODUCTS.find(p => p.id === 'website-deposit')!
export const FULL_PRODUCT = PRODUCTS.find(p => p.id === 'website-full')!

// Balance amount for authorization hold (in cents)
export const BALANCE_AMOUNT_CENTS = 49900 // $499.00
