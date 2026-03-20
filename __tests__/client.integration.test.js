import { StripeClient } from '../src/stripe.js'

const API_KEY = process.env.STRIPE_API_KEY
const describeIf = (cond) => (cond ? describe : describe.skip)

describeIf(API_KEY)('Integration (Stripe API)', () => {
  let client
  beforeAll(() => {
    client = new StripeClient({ apiKey: API_KEY })
  })

  test('get-balance returns available and pending', async () => {
    const result = await client.getBalance()
    expect(result).toHaveProperty('available')
    expect(result).toHaveProperty('pending')
  })

  test('list-customers returns data array', async () => {
    const result = await client.listCustomers({ limit: 1 })
    expect(result).toHaveProperty('data')
    expect(Array.isArray(result.data)).toBe(true)
  })
})
