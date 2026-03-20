import { jest } from '@jest/globals'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockCore = await import('../__fixtures__/core.js')
jest.unstable_mockModule('@actions/core', () => mockCore)

const { run } = await import('../src/main.js')

function mockOk(data) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
  })
}

function ok(inputs, response) {
  return async () => {
    mockCore.setInputs({ 'api-key': 'sk_test_abc', ...inputs })
    mockOk(response)
    await run()
    expect(mockCore.getErrors()).toHaveLength(0)
    return JSON.parse(mockCore.getOutputs().result)
  }
}

describe('run', () => {
  beforeEach(() => {
    mockCore.reset()
    mockFetch.mockReset()
  })

  // -- Payments ---------------------------------------------------------------

  test(
    'create-payment',
    ok({ command: 'create-payment', amount: '1000' }, { id: 'pi_1', amount: 1000 }),
  )
  test(
    'get-payment',
    ok({ command: 'get-payment', 'payment-id': 'pi_1' }, { id: 'pi_1', status: 'succeeded' }),
  )
  test('confirm-payment', ok({ command: 'confirm-payment', 'payment-id': 'pi_1' }, { id: 'pi_1' }))
  test('capture-payment', ok({ command: 'capture-payment', 'payment-id': 'pi_1' }, { id: 'pi_1' }))
  test(
    'cancel-payment',
    ok({ command: 'cancel-payment', 'payment-id': 'pi_1' }, { id: 'pi_1', status: 'canceled' }),
  )
  test(
    'list-payments',
    ok({ command: 'list-payments' }, { data: [{ id: 'pi_1' }], has_more: false }),
  )

  // -- Customers --------------------------------------------------------------

  test('create-customer', ok({ command: 'create-customer', email: 'a@b.com' }, { id: 'cus_1' }))
  test('get-customer', ok({ command: 'get-customer', 'customer-id': 'cus_1' }, { id: 'cus_1' }))
  test(
    'update-customer',
    ok({ command: 'update-customer', 'customer-id': 'cus_1', name: 'New' }, { id: 'cus_1' }),
  )
  test(
    'delete-customer',
    ok({ command: 'delete-customer', 'customer-id': 'cus_1' }, { id: 'cus_1', deleted: true }),
  )
  test('list-customers', ok({ command: 'list-customers' }, { data: [], has_more: false }))

  // -- Balance ----------------------------------------------------------------

  test('get-balance', ok({ command: 'get-balance' }, { available: [{ amount: 5000 }] }))
  test('list-balance-transactions', ok({ command: 'list-balance-transactions' }, { data: [] }))

  // -- Products & Prices ------------------------------------------------------

  test('create-product', ok({ command: 'create-product', name: 'Widget' }, { id: 'prod_1' }))
  test('get-product', ok({ command: 'get-product', 'product-id': 'prod_1' }, { id: 'prod_1' }))
  test('list-products', ok({ command: 'list-products' }, { data: [] }))
  test(
    'create-price',
    ok(
      { command: 'create-price', 'product-id': 'prod_1', 'unit-amount': '999' },
      { id: 'price_1' },
    ),
  )
  test('get-price', ok({ command: 'get-price', 'price-id': 'price_1' }, { id: 'price_1' }))
  test('list-prices', ok({ command: 'list-prices' }, { data: [] }))

  // -- Subscriptions ----------------------------------------------------------

  test(
    'create-subscription',
    ok(
      { command: 'create-subscription', 'customer-id': 'cus_1', 'price-id': 'price_1' },
      { id: 'sub_1' },
    ),
  )
  test(
    'get-subscription',
    ok({ command: 'get-subscription', 'subscription-id': 'sub_1' }, { id: 'sub_1' }),
  )
  test(
    'cancel-subscription',
    ok(
      { command: 'cancel-subscription', 'subscription-id': 'sub_1' },
      { id: 'sub_1', status: 'canceled' },
    ),
  )
  test('list-subscriptions', ok({ command: 'list-subscriptions' }, { data: [] }))

  // -- Invoices ---------------------------------------------------------------

  test('create-invoice', ok({ command: 'create-invoice', 'customer-id': 'cus_1' }, { id: 'in_1' }))
  test('get-invoice', ok({ command: 'get-invoice', 'invoice-id': 'in_1' }, { id: 'in_1' }))
  test(
    'pay-invoice',
    ok({ command: 'pay-invoice', 'invoice-id': 'in_1' }, { id: 'in_1', status: 'paid' }),
  )
  test('list-invoices', ok({ command: 'list-invoices' }, { data: [] }))

  // -- Refunds ----------------------------------------------------------------

  test('create-refund', ok({ command: 'create-refund', 'payment-id': 'pi_1' }, { id: 're_1' }))
  test('get-refund', ok({ command: 'get-refund', 'refund-id': 're_1' }, { id: 're_1' }))
  test('list-refunds', ok({ command: 'list-refunds' }, { data: [] }))

  // -- Payouts ----------------------------------------------------------------

  test('create-payout', ok({ command: 'create-payout', amount: '5000' }, { id: 'po_1' }))
  test('get-payout', ok({ command: 'get-payout', 'payout-id': 'po_1' }, { id: 'po_1' }))
  test('cancel-payout', ok({ command: 'cancel-payout', 'payout-id': 'po_1' }, { id: 'po_1' }))
  test('list-payouts', ok({ command: 'list-payouts' }, { data: [] }))

  // -- Transfers --------------------------------------------------------------

  test(
    'create-transfer',
    ok({ command: 'create-transfer', amount: '1000', destination: 'acct_1' }, { id: 'tr_1' }),
  )
  test('get-transfer', ok({ command: 'get-transfer', 'transfer-id': 'tr_1' }, { id: 'tr_1' }))
  test('list-transfers', ok({ command: 'list-transfers' }, { data: [] }))

  // -- General ----------------------------------------------------------------

  test('unknown command fails', async () => {
    mockCore.setInputs({ command: 'nope', 'api-key': 'sk_test_abc' })
    await run()
    expect(mockCore.getErrors()).toHaveLength(1)
    expect(mockCore.getErrors()[0]).toContain('Unknown command')
  })

  test('missing api-key fails', async () => {
    mockCore.setInputs({ command: 'get-balance' })
    await run()
    expect(mockCore.getErrors()).toHaveLength(1)
  })
})
