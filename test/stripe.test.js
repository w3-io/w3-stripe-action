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

describe('StripeClient: customers (validation)', () => {
  it('getCustomer', async () => {
    mockFetch([{ body: { id: 'cus_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getCustomer('cus_1')
    assert.match(calls[0].url, /\/v1\/customers\/cus_1/)
  })

  it('getCustomer throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getCustomer(''), /customer-id is required/)
  })

  it('updateCustomer throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.updateCustomer('', { name: 'x' }), /customer-id is required/)
  })

  it('deleteCustomer throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.deleteCustomer(''), /customer-id is required/)
  })
})

describe('StripeClient: products (extra)', () => {
  it('listProducts', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listProducts({ limit: 5 })
    assert.match(calls[0].url, /\/v1\/products\?/)
    assert.match(calls[0].url, /limit=5/)
  })

  it('getProduct throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getProduct(''), /product-id is required/)
  })
})

describe('StripeClient: prices (extra)', () => {
  it('getPrice', async () => {
    mockFetch([{ body: { id: 'price_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getPrice('price_1')
    assert.match(calls[0].url, /\/v1\/prices\/price_1/)
  })

  it('getPrice throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getPrice(''), /price-id is required/)
  })

  it('createPrice throws without unitAmount', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createPrice({ product: 'prod_1' }), /unit-amount is required/)
  })

  it('listPrices', async () => {
    mockFetch([{ body: { data: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.listPrices({ product: 'prod_1' })
    assert.match(calls[0].url, /\/v1\/prices\?/)
    assert.match(calls[0].url, /product=prod_1/)
  })
})

describe('StripeClient: subscriptions (extra)', () => {
  it('getSubscription', async () => {
    mockFetch([{ body: { id: 'sub_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getSubscription('sub_1')
    assert.match(calls[0].url, /\/v1\/subscriptions\/sub_1/)
  })

  it('getSubscription throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getSubscription(''), /subscription-id is required/)
  })

  it('cancelSubscription throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.cancelSubscription(''), /subscription-id is required/)
  })

  it('createSubscription throws without price', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createSubscription({ customer: 'cus_1' }), /price-id is required/)
  })

  it('createSubscription with defaultPaymentMethod', async () => {
    mockFetch([{ body: { id: 'sub_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createSubscription({
      customer: 'cus_1',
      price: 'price_1',
      defaultPaymentMethod: 'pm_1',
    })
    assert.match(calls[0].options.body, /default_payment_method=pm_1/)
  })
})

describe('StripeClient: invoices (extra)', () => {
  it('getInvoice', async () => {
    mockFetch([{ body: { id: 'in_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getInvoice('in_1')
    assert.match(calls[0].url, /\/v1\/invoices\/in_1/)
  })

  it('getInvoice throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getInvoice(''), /invoice-id is required/)
  })

  it('payInvoice throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.payInvoice(''), /invoice-id is required/)
  })

  it('createInvoice throws without customer', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createInvoice({}), /customer-id is required/)
  })

  it('createInvoice with description and metadata', async () => {
    mockFetch([{ body: { id: 'in_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createInvoice({ customer: 'cus_1', description: 'Test', metadata: { k: 'v' } })
    assert.match(calls[0].options.body, /description=Test/)
    assert.match(calls[0].options.body, /metadata%5Bk%5D=v/)
  })
})

describe('StripeClient: refunds (extra)', () => {
  it('getRefund', async () => {
    mockFetch([{ body: { id: 're_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getRefund('re_1')
    assert.match(calls[0].url, /\/v1\/refunds\/re_1/)
  })

  it('getRefund throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getRefund(''), /refund-id is required/)
  })

  it('createRefund throws without paymentIntent', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createRefund({}), /payment-id is required/)
  })

  it('createRefund with amount and reason', async () => {
    mockFetch([{ body: { id: 're_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createRefund({ paymentIntent: 'pi_1', amount: 500, reason: 'duplicate' })
    assert.match(calls[0].options.body, /amount=500/)
    assert.match(calls[0].options.body, /reason=duplicate/)
  })
})

describe('StripeClient: payouts (extra)', () => {
  it('createPayout', async () => {
    mockFetch([{ body: { id: 'po_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createPayout({ amount: 5000, description: 'Weekly' })
    assert.match(calls[0].options.body, /amount=5000/)
    assert.match(calls[0].options.body, /description=Weekly/)
  })

  it('createPayout throws without amount', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createPayout({}), /amount is required/)
  })

  it('getPayout', async () => {
    mockFetch([{ body: { id: 'po_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getPayout('po_1')
    assert.match(calls[0].url, /\/v1\/payouts\/po_1/)
  })

  it('getPayout throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getPayout(''), /payout-id is required/)
  })

  it('cancelPayout throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.cancelPayout(''), /payout-id is required/)
  })
})

describe('StripeClient: transfers (extra)', () => {
  it('getTransfer', async () => {
    mockFetch([{ body: { id: 'tr_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getTransfer('tr_1')
    assert.match(calls[0].url, /\/v1\/transfers\/tr_1/)
  })

  it('getTransfer throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getTransfer(''), /transfer-id is required/)
  })

  it('createTransfer throws without amount', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createTransfer({ destination: 'acct_1' }), /amount is required/)
  })

  it('createTransfer with description', async () => {
    mockFetch([{ body: { id: 'tr_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createTransfer({ amount: 1000, destination: 'acct_1', description: 'Payout' })
    assert.match(calls[0].options.body, /description=Payout/)
  })
})

describe('StripeClient: charges', () => {
  it('createCharge', async () => {
    mockFetch([{ body: { id: 'ch_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createCharge({
      amount: 2000,
      source: 'tok_visa',
      description: 'Test',
      metadata: { order: '123' },
    })
    const body = calls[0].options.body
    assert.match(body, /amount=2000/)
    assert.match(body, /source=tok_visa/)
    assert.match(body, /description=Test/)
    assert.match(body, /metadata%5Border%5D=123/)
  })

  it('createCharge throws without amount', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createCharge({ source: 'tok_visa' }), /amount is required/)
  })

  it('createCharge throws without source', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.createCharge({ amount: 100 }), /source is required/)
  })
})

describe('StripeClient: createTestDispute', () => {
  it('creates dispute and polls', async () => {
    mockFetch([
      { body: { id: 'pi_test' } },
      { body: { data: [{ id: 'dp_1', status: 'needs_response' }] } },
    ])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    const result = await c.createTestDispute()
    assert.equal(result.payment_intent.id, 'pi_test')
    assert.equal(result.dispute.id, 'dp_1')
  })

  it('returns null dispute after polling timeout', async () => {
    const responses = [{ body: { id: 'pi_test' } }]
    // 10 polling attempts with empty results
    for (let i = 0; i < 10; i++) {
      responses.push({ body: { data: [] } })
    }
    mockFetch(responses)
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    const result = await c.createTestDispute({ amount: 500, currency: 'eur' })
    assert.equal(result.payment_intent.id, 'pi_test')
    assert.equal(result.dispute, null)
  })
})

describe('StripeClient: crypto onramp', () => {
  it('createOnrampSession with all params', async () => {
    mockFetch([{ body: { id: 'cos_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createOnrampSession({
      walletAddresses: { ethereum: '0xabc' },
      lockWalletAddress: true,
      sourceCurrency: 'usd',
      sourceAmount: '100',
      destinationCurrency: 'eth',
      destinationNetwork: 'ethereum',
      destinationAmount: '0.05',
      destinationCurrencies: ['eth', 'usdc'],
      destinationNetworks: ['ethereum', 'polygon'],
      customerEmail: 'a@b.com',
      customerIpAddress: '1.2.3.4',
    })
    const body = calls[0].options.body
    assert.match(body, /wallet_addresses%5Bethereum%5D=0xabc/)
    assert.match(body, /lock_wallet_address=true/)
    assert.match(body, /source_currency=usd/)
    assert.match(body, /source_amount=100/)
    assert.match(body, /destination_currency=eth/)
    assert.match(body, /destination_network=ethereum/)
    assert.match(body, /destination_amount=0.05/)
    assert.match(body, /destination_currencies%5B0%5D=eth/)
    assert.match(body, /destination_currencies%5B1%5D=usdc/)
    assert.match(body, /destination_networks%5B0%5D=ethereum/)
    assert.match(body, /destination_networks%5B1%5D=polygon/)
    assert.match(body, /customer_information%5Bemail%5D=a%40b.com/)
    assert.match(body, /customer_ip_address=1.2.3.4/)
  })

  it('createOnrampSession with minimal params', async () => {
    mockFetch([{ body: { id: 'cos_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.createOnrampSession({})
    assert.match(calls[0].url, /\/v1\/crypto\/onramp_sessions/)
  })

  it('getOnrampSession', async () => {
    mockFetch([{ body: { id: 'cos_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getOnrampSession('cos_1')
    assert.match(calls[0].url, /\/v1\/crypto\/onramp_sessions\/cos_1/)
  })

  it('getOnrampSession throws without id', async () => {
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(() => c.getOnrampSession(''), /session-id is required/)
  })

  it('getOnrampQuotes with all params', async () => {
    mockFetch([{ body: { quotes: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getOnrampQuotes({
      sourceCurrency: 'eur',
      sourceAmount: '50',
      destinationAmount: '0.01',
      destinationCurrencies: ['btc'],
      destinationNetworks: ['bitcoin'],
    })
    const url = calls[0].url
    assert.match(url, /source_currency=eur/)
    assert.match(url, /source_amount=50/)
    assert.match(url, /destination_amount=0.01/)
    assert.match(url, /destination_currencies%5B0%5D=btc/)
    assert.match(url, /destination_networks%5B0%5D=bitcoin/)
  })

  it('getOnrampQuotes with defaults', async () => {
    mockFetch([{ body: { quotes: [] } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.getOnrampQuotes()
    assert.match(calls[0].url, /source_currency=usd/)
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

  it('throws on invalid JSON response', async () => {
    mockFetch([{ status: 200, body: 'not json {{{' }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(
      () => c.getBalance(),
      (err) => err instanceof StripeError && err.code === 'PARSE_ERROR',
    )
  })

  it('returns empty object for empty response body', async () => {
    mockFetch([{ status: 200, body: '' }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    const result = await c.getBalance()
    assert.deepEqual(result, {})
  })

  it('parses error without structured error body', async () => {
    mockFetch([{ status: 403, body: 'plain text error' }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await assert.rejects(
      () => c.getBalance(),
      (err) => err instanceof StripeError && err.code === 'API_ERROR' && err.status === 403,
    )
  })

  it('capturePayment with amountToCapture', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.capturePayment('pi_1', { amountToCapture: 500 })
    assert.match(calls[0].options.body, /amount_to_capture=500/)
  })

  it('confirmPayment without paymentMethod', async () => {
    mockFetch([{ body: { id: 'pi_1' } }])
    const c = new StripeClient({ apiKey: 'sk_test_abc' })
    await c.confirmPayment('pi_1')
    // No body params for confirm without payment method
    assert.match(calls[0].url, /\/confirm/)
  })
})
