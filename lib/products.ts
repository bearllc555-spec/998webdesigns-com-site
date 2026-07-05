import { DESIGN_LIST_CENTS } from "@/lib/design-promo-codes";
import {
  HOSTING_BILLING_START_DAY,
  HOSTING_MONTHLY_PRICE_CENTS,
  HOSTING_MONTHLY_PRICE_MO_LABEL,
  HOSTING_TRIAL_DAYS,
} from "@/lib/hosting-policy";

const designListLabel = `$${(DESIGN_LIST_CENTS / 100).toLocaleString("en-US")}`;

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
    description: `Custom website design (${designListLabel} total - 50% deposit at checkout).`,
    priceInCents: DESIGN_LIST_CENTS,
  },
]

export const FULL_PRODUCT = PRODUCTS[0]!

/** 10-year hosting (pricing page: $2,996 one-time). */
export const HOSTING_TEN_YEAR_PRODUCT: Product = {
  id: 'hosting-ten-year',
  name: '10-Year Hosting',
  description: 'One-time 10-year hosting, including domain registration (.com, .net, .org).',
  priceInCents: 299600,
}

/** @deprecated Use HOSTING_TEN_YEAR_PRODUCT */
export const HOSTING_LIFETIME_PRODUCT = HOSTING_TEN_YEAR_PRODUCT

/** Recurring line in subscription Checkout when lead selects month-to-month hosting. */
export const HOSTING_MONTHLY_PRODUCT: Product = {
  id: 'hosting-monthly',
  name: 'Month-to-month hosting',
  description: `Managed hosting for your site. First ${HOSTING_TRIAL_DAYS} days free; ${HOSTING_MONTHLY_PRICE_MO_LABEL} starting day ${HOSTING_BILLING_START_DAY}. Cancel anytime.`,
  priceInCents: HOSTING_MONTHLY_PRICE_CENTS,
}

/** Billed in a separate Checkout ${HOSTING_TRIAL_DAYS} days after design payment (10-year path). */
export const HOSTING_TEN_YEAR_DEFERRED_PRODUCT: Product = {
  id: 'hosting-ten-year-deferred',
  name: '10-Year Hosting',
  description:
    'One-time 10-year hosting, including domain registration (.com, .net, .org). Hosting begins when this payment clears.',
  priceInCents: 299600,
}

/** @deprecated Use HOSTING_TEN_YEAR_DEFERRED_PRODUCT */
export const HOSTING_LIFETIME_DEFERRED_PRODUCT = HOSTING_TEN_YEAR_DEFERRED_PRODUCT
