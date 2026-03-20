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

describe('run', () => {
  beforeEach(() => {
    mockCore.reset()
    mockFetch.mockReset()
  })

  // -- Payments ---------------------------------------------------------------

  test('create-payment returns payment intent', async () => {
    mockCore.setInputs({ command: 'create-payment', 'api-key': 'sk_test_abc', amount: '1000' })
    mockOk({ id: 'pi_1', status: 'requires_payment_method', amount: 1000 })

    await run()

    const result = JSON.parse(mockCore.getOutputs().result)
    expect(result.id).toBe('pi_1')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  test('get-payment returns payment details', async () => {
    mockCore.setInputs({ command: 'get-payment', 'api-key': 'sk_test_abc', 'payment-id': 'pi_1' })
    mockOk({ id: 'pi_1', status: 'succeeded' })

    await run()

    const result = JSON.parse(mockCore.getOutputs().result)
    expect(result.status).toBe('succeeded')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  test('confirm-payment confirms', async () => {
    mockCore.setInputs({
      command: 'confirm-payment',
      'api-key': 'sk_test_abc',
      'payment-id': 'pi_1',
    })
    mockOk({ id: 'pi_1', status: 'succeeded' })

    await run()

    expect(mockFetch.mock.calls[0][0]).toContain('/confirm')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  test('cancel-payment cancels', async () => {
    mockCore.setInputs({
      command: 'cancel-payment',
      'api-key': 'sk_test_abc',
      'payment-id': 'pi_1',
    })
    mockOk({ id: 'pi_1', status: 'canceled' })

    await run()

    expect(mockFetch.mock.calls[0][0]).toContain('/cancel')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  // -- Customers --------------------------------------------------------------

  test('create-customer creates', async () => {
    mockCore.setInputs({
      command: 'create-customer',
      'api-key': 'sk_test_abc',
      email: 'a@b.com',
      name: 'Test',
    })
    mockOk({ id: 'cus_1', email: 'a@b.com' })

    await run()

    const result = JSON.parse(mockCore.getOutputs().result)
    expect(result.id).toBe('cus_1')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  test('get-customer retrieves', async () => {
    mockCore.setInputs({
      command: 'get-customer',
      'api-key': 'sk_test_abc',
      'customer-id': 'cus_1',
    })
    mockOk({ id: 'cus_1', email: 'a@b.com' })

    await run()

    expect(JSON.parse(mockCore.getOutputs().result).id).toBe('cus_1')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  test('list-customers returns array', async () => {
    mockCore.setInputs({ command: 'list-customers', 'api-key': 'sk_test_abc' })
    mockOk({ data: [{ id: 'cus_1' }], has_more: false })

    await run()

    const result = JSON.parse(mockCore.getOutputs().result)
    expect(result.data).toHaveLength(1)
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  // -- Balance ----------------------------------------------------------------

  test('get-balance returns balance', async () => {
    mockCore.setInputs({ command: 'get-balance', 'api-key': 'sk_test_abc' })
    mockOk({ available: [{ amount: 5000, currency: 'usd' }], pending: [] })

    await run()

    const result = JSON.parse(mockCore.getOutputs().result)
    expect(result.available[0].amount).toBe(5000)
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  // -- Refunds ----------------------------------------------------------------

  test('create-refund refunds payment', async () => {
    mockCore.setInputs({
      command: 'create-refund',
      'api-key': 'sk_test_abc',
      'payment-id': 'pi_1',
    })
    mockOk({ id: 're_1', status: 'succeeded' })

    await run()

    expect(JSON.parse(mockCore.getOutputs().result).id).toBe('re_1')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  test('get-refund retrieves', async () => {
    mockCore.setInputs({
      command: 'get-refund',
      'api-key': 'sk_test_abc',
      'refund-id': 're_1',
    })
    mockOk({ id: 're_1', status: 'succeeded' })

    await run()

    expect(JSON.parse(mockCore.getOutputs().result).status).toBe('succeeded')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  // -- Payouts ----------------------------------------------------------------

  test('create-payout creates', async () => {
    mockCore.setInputs({ command: 'create-payout', 'api-key': 'sk_test_abc', amount: '5000' })
    mockOk({ id: 'po_1', status: 'pending' })

    await run()

    expect(JSON.parse(mockCore.getOutputs().result).id).toBe('po_1')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  test('get-payout retrieves', async () => {
    mockCore.setInputs({
      command: 'get-payout',
      'api-key': 'sk_test_abc',
      'payout-id': 'po_1',
    })
    mockOk({ id: 'po_1', status: 'paid' })

    await run()

    expect(JSON.parse(mockCore.getOutputs().result).status).toBe('paid')
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  // -- General ----------------------------------------------------------------

  test('unknown command fails', async () => {
    mockCore.setInputs({ command: 'nonexistent', 'api-key': 'sk_test_abc' })

    await run()

    const errors = mockCore.getErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Unknown command')
    expect(errors[0]).toContain('create-payment')
  })

  test('missing api-key fails', async () => {
    mockCore.setInputs({ command: 'get-balance' })

    await run()

    expect(mockCore.getErrors()).toHaveLength(1)
  })

  test('Stripe API error is reported', async () => {
    mockCore.setInputs({ command: 'get-balance', 'api-key': 'sk_test_abc' })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({ error: { message: 'Invalid API Key', code: 'invalid_api_key' } }),
    })

    await run()

    const errors = mockCore.getErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('invalid_api_key')
  })
})
