import { jest } from '@jest/globals'
import { StripeClient, StripeError } from '../src/stripe.js'

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockOk(data) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
  })
}

function mockError(status, body) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => body,
  })
}

describe('StripeClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('constructor requires api key', () => {
    expect(() => new StripeClient({})).toThrow('API key is required')
  })

  test('constructor strips trailing slash from base URL', () => {
    const client = new StripeClient({ apiKey: 'sk_test_123', baseUrl: 'https://example.com/' })
    expect(client.baseUrl).toBe('https://example.com')
  })

  test('uses Basic auth with base64-encoded key', async () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })
    mockOk({ id: 'bal_1' })

    await client.getBalance()

    const auth = mockFetch.mock.calls[0][1].headers.Authorization
    const decoded = Buffer.from(auth.replace('Basic ', ''), 'base64').toString()
    expect(decoded).toBe('sk_test_abc:')
  })

  test('sends form-encoded POST bodies', async () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })
    mockOk({ id: 'pi_1', status: 'requires_payment_method' })

    await client.createPayment({ amount: 1000, currency: 'usd' })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(opts.body).toContain('amount=1000')
    expect(opts.body).toContain('currency=usd')
  })

  describe('createPayment', () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })

    test('sends amount and currency', async () => {
      mockOk({ id: 'pi_1', amount: 2000 })

      const result = await client.createPayment({ amount: 2000, currency: 'eur' })

      expect(result.id).toBe('pi_1')
      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('amount=2000')
      expect(body).toContain('currency=eur')
    })

    test('sends metadata as bracket notation', async () => {
      mockOk({ id: 'pi_1' })

      await client.createPayment({ amount: 100, metadata: { order: '123' } })

      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('metadata%5Border%5D=123')
    })

    test('throws without amount', async () => {
      await expect(client.createPayment({})).rejects.toThrow('amount is required')
    })
  })

  describe('getPayment', () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })

    test('fetches by ID', async () => {
      mockOk({ id: 'pi_123', status: 'succeeded' })

      const result = await client.getPayment('pi_123')

      expect(result.status).toBe('succeeded')
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/payment_intents/pi_123')
    })

    test('throws without ID', async () => {
      await expect(client.getPayment('')).rejects.toThrow('payment-id is required')
    })
  })

  describe('createCustomer', () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })

    test('sends email and name', async () => {
      mockOk({ id: 'cus_1', email: 'a@b.com' })

      const result = await client.createCustomer({ email: 'a@b.com', name: 'Test' })

      expect(result.id).toBe('cus_1')
      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('email=a%40b.com')
      expect(body).toContain('name=Test')
    })
  })

  describe('getBalance', () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })

    test('returns balance object', async () => {
      mockOk({ available: [{ amount: 5000, currency: 'usd' }] })

      const result = await client.getBalance()

      expect(result.available[0].amount).toBe(5000)
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/balance')
    })
  })

  describe('createRefund', () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })

    test('sends payment_intent', async () => {
      mockOk({ id: 're_1', status: 'succeeded' })

      await client.createRefund({ paymentIntent: 'pi_123' })

      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('payment_intent=pi_123')
    })

    test('throws without paymentIntent', async () => {
      await expect(client.createRefund({})).rejects.toThrow('payment-id is required')
    })
  })

  describe('createPayout', () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })

    test('sends amount', async () => {
      mockOk({ id: 'po_1', status: 'pending' })

      await client.createPayout({ amount: 5000 })

      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('amount=5000')
    })

    test('throws without amount', async () => {
      await expect(client.createPayout({})).rejects.toThrow('amount is required')
    })
  })

  describe('error handling', () => {
    const client = new StripeClient({ apiKey: 'sk_test_abc' })

    test('parses Stripe error format', async () => {
      mockError(
        402,
        JSON.stringify({
          error: { message: 'Card declined', code: 'card_declined', type: 'card_error' },
        }),
      )

      try {
        await client.getBalance()
      } catch (e) {
        expect(e).toBeInstanceOf(StripeError)
        expect(e.message).toBe('Card declined')
        expect(e.code).toBe('card_declined')
        expect(e.type).toBe('card_error')
      }
    })

    test('handles non-JSON error', async () => {
      mockError(500, 'Internal Server Error')

      try {
        await client.getBalance()
      } catch (e) {
        expect(e).toBeInstanceOf(StripeError)
        expect(e.code).toBe('API_ERROR')
      }
    })
  })
})
