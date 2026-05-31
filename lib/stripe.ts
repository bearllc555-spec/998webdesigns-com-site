import 'server-only'

import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export const stripe = new Proxy({} as unknown as Stripe, {
  get(_, prop) {
    if (!stripeInstance) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured')
      }
      stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
    }
    return (stripeInstance as unknown as Record<string, unknown>)[prop as string]
  }
})
