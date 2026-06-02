export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
}

export const PRODUCTS: Product[] = [
  {
    id: 'website-full',
    name: 'Website Design',
    description: 'Complete payment for your custom website ($1,998 paid in full to start).',
    priceInCents: 199800, // $1,998.00
  },
]

export const FULL_PRODUCT = PRODUCTS[0]!

/** Billed in Checkout when lead selects ten-year hosting (pricing page: $1,349 one-time). */
export const HOSTING_TEN_YEAR_PRODUCT: Product = {
  id: 'hosting-ten-year',
  name: 'Ten Years of Hosting',
  description: 'One-time hosting for ten years, including domain (com, net, org).',
  priceInCents: 134900,
}
