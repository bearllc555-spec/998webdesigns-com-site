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

/** Lifetime hosting (pricing page: $2,996 one-time). */
export const HOSTING_LIFETIME_PRODUCT: Product = {
  id: 'hosting-lifetime',
  name: 'Lifetime Hosting',
  description: 'One-time lifetime hosting, including domain (com, net, org).',
  priceInCents: 299600,
}

/** Recurring line in subscription Checkout when lead selects month-to-month hosting. */
export const HOSTING_MONTHLY_PRODUCT: Product = {
  id: 'hosting-monthly',
  name: 'Month-to-month hosting',
  description:
    'Managed hosting for your site. First 30 days free; $198/mo starting day 31. Cancel anytime.',
  priceInCents: 19800, // $198.00 / month
}

/** Billed in a separate Checkout 30 days after design payment (lifetime path). */
export const HOSTING_LIFETIME_DEFERRED_PRODUCT: Product = {
  id: 'hosting-lifetime-deferred',
  name: 'Lifetime Hosting',
  description:
    'One-time lifetime hosting, including domain registration (com, net, org). Hosting begins when this payment clears.',
  priceInCents: 299600,
}
