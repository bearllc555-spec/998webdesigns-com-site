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
    description: 'Complete payment for your custom website ($5,998 paid in full to start).',
    priceInCents: 599800, // $5,998.00
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

/** Recurring line in subscription Checkout when lead selects month-to-month hosting. */
export const HOSTING_MONTHLY_PRODUCT: Product = {
  id: 'hosting-monthly',
  name: 'Month-to-month hosting',
  description:
    'Managed hosting for your site. First 30 days free; $198/mo starting day 31. Cancel anytime.',
  priceInCents: 19800, // $198.00 / month
}

/** Billed in a separate Checkout 30 days after design payment (ten-year path). */
export const HOSTING_TEN_YEAR_DEFERRED_PRODUCT: Product = {
  id: 'hosting-ten-year-deferred',
  name: 'Ten Years of Hosting',
  description:
    'One-time hosting for ten years, including domain registration (com, net, org). Term starts when this payment clears.',
  priceInCents: 134900,
}
