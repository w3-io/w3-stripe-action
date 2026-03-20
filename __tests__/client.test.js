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

  test('constructor strips trailing slash', () => {
    const c = new StripeClient({ apiKey: 'sk_test_x', baseUrl: 'https://x.com/' })
    expect(c.baseUrl).toBe('https://x.com')
  })

  test('uses Basic auth', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    mockOk({})
    await c.getBalance()
    const auth = mockFetch.mock.calls[0][1].headers.Authorization
    expect(Buffer.from(auth.replace('Basic ', ''), 'base64').toString()).toBe('sk_test_abc:')
  })

  test('POST sends form-encoded body', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    mockOk({ id: 'pi_1' })
    await c.createPayment({ amount: 1000 })
    const opts = mockFetch.mock.calls[0][1]
    expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(opts.body).toContain('amount=1000')
  })

  // -- Payments ---------------------------------------------------------------

  describe('payments', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('createPayment with metadata', async () => {
      mockOk({ id: 'pi_1' })
      await c.createPayment({ amount: 500, metadata: { key: 'val' } })
      expect(mockFetch.mock.calls[0][1].body).toContain('metadata%5Bkey%5D=val')
    })

    test('getPayment', async () => {
      mockOk({ id: 'pi_1' })
      await c.getPayment('pi_1')
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/payment_intents/pi_1')
    })

    test('confirmPayment', async () => {
      mockOk({ id: 'pi_1' })
      await c.confirmPayment('pi_1', { paymentMethod: 'pm_1' })
      expect(mockFetch.mock.calls[0][0]).toContain('/confirm')
    })

    test('capturePayment', async () => {
      mockOk({ id: 'pi_1' })
      await c.capturePayment('pi_1')
      expect(mockFetch.mock.calls[0][0]).toContain('/capture')
    })

    test('cancelPayment', async () => {
      mockOk({ id: 'pi_1' })
      await c.cancelPayment('pi_1')
      expect(mockFetch.mock.calls[0][0]).toContain('/cancel')
    })

    test('listPayments', async () => {
      mockOk({ data: [] })
      await c.listPayments({ customer: 'cus_1' })
      expect(mockFetch.mock.calls[0][0]).toContain('customer=cus_1')
    })

    test('createPayment throws without amount', async () => {
      await expect(c.createPayment({})).rejects.toThrow('amount is required')
    })

    test('getPayment throws without id', async () => {
      await expect(c.getPayment('')).rejects.toThrow('payment-id is required')
    })
  })

  // -- Customers --------------------------------------------------------------

  describe('customers', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('createCustomer', async () => {
      mockOk({ id: 'cus_1' })
      await c.createCustomer({ email: 'a@b.com' })
      expect(mockFetch.mock.calls[0][1].body).toContain('email=a%40b.com')
    })

    test('updateCustomer', async () => {
      mockOk({ id: 'cus_1' })
      await c.updateCustomer('cus_1', { name: 'New' })
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/customers/cus_1')
      expect(mockFetch.mock.calls[0][1].body).toContain('name=New')
    })

    test('deleteCustomer', async () => {
      mockOk({ id: 'cus_1', deleted: true })
      await c.deleteCustomer('cus_1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    test('listCustomers with email', async () => {
      mockOk({ data: [] })
      await c.listCustomers({ email: 'a@b.com' })
      expect(mockFetch.mock.calls[0][0]).toContain('email=a%40b.com')
    })
  })

  // -- Balance ----------------------------------------------------------------

  describe('balance', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('getBalance', async () => {
      mockOk({ available: [{ amount: 5000 }] })
      const r = await c.getBalance()
      expect(r.available[0].amount).toBe(5000)
    })

    test('listBalanceTransactions', async () => {
      mockOk({ data: [] })
      await c.listBalanceTransactions({ type: 'charge' })
      expect(mockFetch.mock.calls[0][0]).toContain('type=charge')
    })
  })

  // -- Products & Prices ------------------------------------------------------

  describe('products', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('createProduct', async () => {
      mockOk({ id: 'prod_1' })
      await c.createProduct({ name: 'Widget' })
      expect(mockFetch.mock.calls[0][1].body).toContain('name=Widget')
    })

    test('createProduct throws without name', async () => {
      await expect(c.createProduct({})).rejects.toThrow('name is required')
    })

    test('getProduct', async () => {
      mockOk({ id: 'prod_1' })
      await c.getProduct('prod_1')
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/products/prod_1')
    })
  })

  describe('prices', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('createPrice one-time', async () => {
      mockOk({ id: 'price_1' })
      await c.createPrice({ product: 'prod_1', unitAmount: 1000 })
      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('product=prod_1')
      expect(body).toContain('unit_amount=1000')
    })

    test('createPrice recurring', async () => {
      mockOk({ id: 'price_1' })
      await c.createPrice({ product: 'prod_1', unitAmount: 999, recurring: 'month' })
      expect(mockFetch.mock.calls[0][1].body).toContain('recurring%5Binterval%5D=month')
    })

    test('createPrice throws without product', async () => {
      await expect(c.createPrice({ unitAmount: 100 })).rejects.toThrow('product-id is required')
    })
  })

  // -- Subscriptions ----------------------------------------------------------

  describe('subscriptions', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('createSubscription', async () => {
      mockOk({ id: 'sub_1' })
      await c.createSubscription({ customer: 'cus_1', price: 'price_1' })
      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('customer=cus_1')
      expect(body).toContain('items%5B0%5D%5Bprice%5D=price_1')
    })

    test('cancelSubscription', async () => {
      mockOk({ id: 'sub_1', status: 'canceled' })
      await c.cancelSubscription('sub_1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    test('listSubscriptions', async () => {
      mockOk({ data: [] })
      await c.listSubscriptions({ status: 'active' })
      expect(mockFetch.mock.calls[0][0]).toContain('status=active')
    })

    test('throws without customer', async () => {
      await expect(c.createSubscription({ price: 'p' })).rejects.toThrow('customer-id')
    })
  })

  // -- Invoices ---------------------------------------------------------------

  describe('invoices', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('createInvoice', async () => {
      mockOk({ id: 'in_1' })
      await c.createInvoice({ customer: 'cus_1' })
      expect(mockFetch.mock.calls[0][1].body).toContain('customer=cus_1')
    })

    test('payInvoice', async () => {
      mockOk({ id: 'in_1', status: 'paid' })
      await c.payInvoice('in_1')
      expect(mockFetch.mock.calls[0][0]).toContain('/pay')
    })

    test('listInvoices', async () => {
      mockOk({ data: [] })
      await c.listInvoices({ status: 'open' })
      expect(mockFetch.mock.calls[0][0]).toContain('status=open')
    })
  })

  // -- Refunds ----------------------------------------------------------------

  describe('refunds', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('createRefund', async () => {
      mockOk({ id: 're_1' })
      await c.createRefund({ paymentIntent: 'pi_1' })
      expect(mockFetch.mock.calls[0][1].body).toContain('payment_intent=pi_1')
    })

    test('listRefunds', async () => {
      mockOk({ data: [] })
      await c.listRefunds({ paymentIntent: 'pi_1' })
      expect(mockFetch.mock.calls[0][0]).toContain('payment_intent=pi_1')
    })
  })

  // -- Payouts ----------------------------------------------------------------

  describe('payouts', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('cancelPayout', async () => {
      mockOk({ id: 'po_1' })
      await c.cancelPayout('po_1')
      expect(mockFetch.mock.calls[0][0]).toContain('/cancel')
    })

    test('listPayouts', async () => {
      mockOk({ data: [] })
      await c.listPayouts({ status: 'paid' })
      expect(mockFetch.mock.calls[0][0]).toContain('status=paid')
    })
  })

  // -- Transfers --------------------------------------------------------------

  describe('transfers', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('createTransfer', async () => {
      mockOk({ id: 'tr_1' })
      await c.createTransfer({ amount: 1000, destination: 'acct_1' })
      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('amount=1000')
      expect(body).toContain('destination=acct_1')
    })

    test('throws without destination', async () => {
      await expect(c.createTransfer({ amount: 100 })).rejects.toThrow('destination is required')
    })

    test('listTransfers', async () => {
      mockOk({ data: [] })
      await c.listTransfers({ destination: 'acct_1' })
      expect(mockFetch.mock.calls[0][0]).toContain('destination=acct_1')
    })
  })

  // -- Error handling ---------------------------------------------------------

  describe('errors', () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    test('parses Stripe error', async () => {
      mockError(
        402,
        JSON.stringify({
          error: { message: 'Card declined', code: 'card_declined', type: 'card_error' },
        }),
      )
      try {
        await c.getBalance()
      } catch (e) {
        expect(e).toBeInstanceOf(StripeError)
        expect(e.message).toBe('Card declined')
        expect(e.code).toBe('card_declined')
      }
    })

    test('handles non-JSON error', async () => {
      mockError(500, 'Internal Server Error')
      try {
        await c.getBalance()
      } catch (e) {
        expect(e.code).toBe('API_ERROR')
      }
    })
  })
})
