/**
 * StripeClient unit tests.
 *
 * Mocks `fetch` globally so we can test the client without hitting
 * the real Stripe API.
 *
 * Run with: npm test
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { StripeClient, StripeError } from '../src/stripe.js'

let originalFetch
let calls

beforeEach(() => {
  originalFetch = global.fetch
  calls = []
})

afterEach(() => {
  global.fetch = originalFetch
})

function mockFetch(responses) {
  let index = 0
  global.fetch = async (url, options) => {
    calls.push({ url, options })
    const response = responses[index++]
    if (!response) {
      throw new Error(`Unexpected fetch call ${index}: ${url}`)
    }
    const status = response.status ?? 200
    const ok = status >= 200 && status < 300
    return {
      ok,
      status,
      text: async () =>
        typeof response.body === 'string' ? response.body : JSON.stringify(response.body ?? {}),
    }
  }
}

describe('StripeClient: construction', () => {
  it('requires api key', () => {
    assert.throws(() => new StripeClient({}), /API key is required/)
  })

  it('strips trailing slash', () => {
    const c = new StripeClient({ apiKey: 'sk_test_x', baseUrl: 'https://x.com/' })
    assert.equal(c.baseUrl, 'https://x.com')
  })
})

describe('StripeClient: auth + encoding', () => {
  it('uses Basic auth', async () => {
    mockFetch([{ body: {} }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getBalance()
    const auth = calls[0].options.headers.Authorization
    assert.equal(Buffer.from(auth.replace('Basic ', ''), 'base64').toString(), 'sk_test_abc:')
  })

  it('POST sends form-encoded body', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createPayment({ amount: 1000 })
    const opts = calls[0].options
    assert.equal(opts.headers['Content-Type'], 'application/x-www-form-urlencoded')
    assert.match(opts.body, /amount=1000/)
  })
})

describe('StripeClient: payments', () => {
  it('createPayment with metadata', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createPayment({ amount: 500, metadata: { key: 'val' } })
    assert.match(calls[0].options.body, /metadata%5Bkey%5D=val/)
  })

  it('getPayment', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getPayment('pi_1')
    assert.match(calls[0].url, /\/v1\/payment_intents\/pi_1/)
  })

  it('confirmPayment', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.confirmPayment('pi_1', { paymentMethod: 'pm_1' })
    assert.match(calls[0].url, /\/confirm/)
  })

  it('capturePayment', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.capturePayment('pi_1')
    assert.match(calls[0].url, /\/capture/)
  })

  it('cancelPayment', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.cancelPayment('pi_1')
    assert.match(calls[0].url, /\/cancel/)
  })

  it('listPayments', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listPayments({ customer: 'cus_1' })
    assert.match(calls[0].url, /customer=cus_1/)
  })

  it('createPayment throws without amount', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createPayment({}), /amount is required/)
  })

  it('getPayment throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getPayment(''), /payment-id is required/)
  })
})

describe('StripeClient: customers', () => {
  it('createCustomer', async () => {
    mockFetch([{ body: { id: 'cus_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createCustomer({ email: 'a@b.com' })
    assert.match(calls[0].options.body, /email=a%40b\.com/)
  })

  it('updateCustomer', async () => {
    mockFetch([{ body: { id: 'cus_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.updateCustomer('cus_1', { name: 'New' })
    assert.match(calls[0].url, /\/v1\/customers\/cus_1/)
    assert.match(calls[0].options.body, /name=New/)
  })

  it('deleteCustomer', async () => {
    mockFetch([{ body: { id: 'cus_1', deleted: true } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.deleteCustomer('cus_1')
    assert.equal(calls[0].options.method, 'DELETE')
  })

  it('listCustomers with email', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listCustomers({ email: 'a@b.com' })
    assert.match(calls[0].url, /email=a%40b\.com/)
  })
})

describe('StripeClient: balance', () => {
  it('getBalance', async () => {
    mockFetch([{ body: { available: [{ amount: 5000 }] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    const r = await c.getBalance()
    assert.equal(r.available[0].amount, 5000)
  })

  it('listBalanceTransactions', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listBalanceTransactions({ type: 'charge' })
    assert.match(calls[0].url, /type=charge/)
  })
})

describe('StripeClient: products', () => {
  it('createProduct', async () => {
    mockFetch([{ body: { id: 'prod_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createProduct({ name: 'Widget' })
    assert.match(calls[0].options.body, /name=Widget/)
  })

  it('createProduct throws without name', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createProduct({}), /name is required/)
  })

  it('getProduct', async () => {
    mockFetch([{ body: { id: 'prod_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getProduct('prod_1')
    assert.match(calls[0].url, /\/v1\/products\/prod_1/)
  })
})

describe('StripeClient: prices', () => {
  it('createPrice one-time', async () => {
    mockFetch([{ body: { id: 'price_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createPrice({ product: 'prod_1', unitAmount: 1000 })
    const body = calls[0].options.body
    assert.match(body, /product=prod_1/)
    assert.match(body, /unit_amount=1000/)
  })

  it('createPrice recurring', async () => {
    mockFetch([{ body: { id: 'price_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createPrice({ product: 'prod_1', unitAmount: 999, recurring: 'month' })
    assert.match(calls[0].options.body, /recurring%5Binterval%5D=month/)
  })

  it('createPrice throws without product', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createPrice({ unitAmount: 100 }), /product-id is required/)
  })
})

describe('StripeClient: subscriptions', () => {
  it('createSubscription', async () => {
    mockFetch([{ body: { id: 'sub_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createSubscription({ customer: 'cus_1', price: 'price_1' })
    const body = calls[0].options.body
    assert.match(body, /customer=cus_1/)
    assert.match(body, /items%5B0%5D%5Bprice%5D=price_1/)
  })

  it('cancelSubscription', async () => {
    mockFetch([{ body: { id: 'sub_1', status: 'canceled' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.cancelSubscription('sub_1')
    assert.equal(calls[0].options.method, 'DELETE')
  })

  it('listSubscriptions', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listSubscriptions({ status: 'active' })
    assert.match(calls[0].url, /status=active/)
  })

  it('throws without customer', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createSubscription({ price: 'p' }), /customer-id/)
  })
})

describe('StripeClient: invoices', () => {
  it('createInvoice', async () => {
    mockFetch([{ body: { id: 'in_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createInvoice({ customer: 'cus_1' })
    assert.match(calls[0].options.body, /customer=cus_1/)
  })

  it('payInvoice', async () => {
    mockFetch([{ body: { id: 'in_1', status: 'paid' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.payInvoice('in_1')
    assert.match(calls[0].url, /\/pay/)
  })

  it('listInvoices', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listInvoices({ status: 'open' })
    assert.match(calls[0].url, /status=open/)
  })
})

describe('StripeClient: refunds', () => {
  it('createRefund', async () => {
    mockFetch([{ body: { id: 're_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createRefund({ paymentIntent: 'pi_1' })
    assert.match(calls[0].options.body, /payment_intent=pi_1/)
  })

  it('listRefunds', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listRefunds({ paymentIntent: 'pi_1' })
    assert.match(calls[0].url, /payment_intent=pi_1/)
  })
})

describe('StripeClient: payouts', () => {
  it('cancelPayout', async () => {
    mockFetch([{ body: { id: 'po_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.cancelPayout('po_1')
    assert.match(calls[0].url, /\/cancel/)
  })

  it('listPayouts', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listPayouts({ status: 'paid' })
    assert.match(calls[0].url, /status=paid/)
  })
})

describe('StripeClient: transfers', () => {
  it('createTransfer', async () => {
    mockFetch([{ body: { id: 'tr_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createTransfer({ amount: 1000, destination: 'acct_1' })
    const body = calls[0].options.body
    assert.match(body, /amount=1000/)
    assert.match(body, /destination=acct_1/)
  })

  it('throws without destination', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createTransfer({ amount: 100 }), /destination is required/)
  })

  it('listTransfers', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listTransfers({ destination: 'acct_1' })
    assert.match(calls[0].url, /destination=acct_1/)
  })
})

describe('StripeClient: disputes', () => {
  it('getDispute', async () => {
    mockFetch([{ body: { id: 'dp_1', status: 'needs_response' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getDispute('dp_1')
    assert.match(calls[0].url, /\/v1\/disputes\/dp_1/)
  })

  it('throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getDispute(''), /dispute-id is required/)
  })

  it('listDisputes', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listDisputes({ paymentIntent: 'pi_1' })
    assert.match(calls[0].url, /payment_intent=pi_1/)
  })
})

describe('StripeClient: events', () => {
  it('getEvent', async () => {
    mockFetch([{ body: { id: 'evt_1', type: 'payment_intent.succeeded' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getEvent('evt_1')
    assert.match(calls[0].url, /\/v1\/events\/evt_1/)
  })

  it('throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getEvent(''), /event-id is required/)
  })

  it('listEvents with type filter', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listEvents({ type: 'payment_intent.succeeded' })
    assert.match(calls[0].url, /type=payment_intent\.succeeded/)
  })
})

describe('StripeClient: errors', () => {
  it('parses Stripe error (no retry on 4xx)', async () => {
    mockFetch([
      {
        status: 402,
        body: JSON.stringify({
          error: { message: 'Card declined', code: 'card_declined', type: 'card_error' },
        }),
      },
    ])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(
      () => c.getBalance(),
      (err) =>
        err instanceof StripeError &&
        err.message === 'Card declined' &&
        err.code === 'card_declined',
    )
    assert.equal(calls.length, 1)
  })

  it('retries on 429 then succeeds', async () => {
    mockFetch([{ status: 429, body: 'Rate limited' }, { body: { available: [{ amount: 100 }] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc', maxRetries: 2 })

    const result = await c.getBalance()

    assert.equal(result.available[0].amount, 100)
    assert.equal(calls.length, 2)
  })

  it('retries on 500 then fails after max retries', async () => {
    mockFetch([
      { status: 500, body: 'Server Error' },
      { status: 500, body: 'Server Error' },
    ])
    const c = new StripeClient({ apiKey: 'sk_test_abc', maxRetries: 1 })

    await assert.rejects(
      () => c.getBalance(),
      (err) => err instanceof StripeError && err.status === 500,
    )
    assert.equal(calls.length, 2)
  })

  it('no retry on 4xx client errors', async () => {
    mockFetch([
      {
        status: 400,
        body: JSON.stringify({ error: { message: 'Bad request', code: 'bad_request' } }),
      },
    ])
    const c = new StripeClient({ apiKey: 'sk_test_abc', maxRetries: 3 })

    await assert.rejects(
      () => c.getBalance(),
      (err) => err.code === 'bad_request',
    )
    assert.equal(calls.length, 1)
  })

  it('POST includes Idempotency-Key header', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    await c.createPayment({ amount: 100 })

    const headers = calls[0].options.headers
    assert.ok(headers['Idempotency-Key'])
    assert.match(
      headers['Idempotency-Key'],
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('GET does not include Idempotency-Key', async () => {
    mockFetch([{ body: {} }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })

    await c.getBalance()

    assert.equal(calls[0].options.headers['Idempotency-Key'], undefined)
  })
})
