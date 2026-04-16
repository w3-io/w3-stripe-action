import { createCommandRouter, setJsonOutput, handleError, W3ActionError } from '@w3-io/action-core'
import * as core from '@actions/core'
import { StripeClient } from './stripe.js'

const router = createCommandRouter({
  // Payments
  'create-payment': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createPayment({
        amount: core.getInput('amount', { required: true }),
        currency: optionalInput('currency'),
        customer: optionalInput('customer-id'),
        description: optionalInput('description'),
        metadata: optionalJson('metadata'),
        captureMethod: optionalInput('capture-method'),
      }),
    )
  },
  'get-payment': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.getPayment(core.getInput('payment-id', { required: true })),
    )
  },
  'confirm-payment': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.confirmPayment(core.getInput('payment-id', { required: true }), {
        paymentMethod: optionalInput('payment-method'),
      }),
    )
  },
  'capture-payment': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.capturePayment(core.getInput('payment-id', { required: true }), {
        amountToCapture: optionalNumber('amount'),
      }),
    )
  },
  'cancel-payment': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.cancelPayment(core.getInput('payment-id', { required: true })),
    )
  },
  'list-payments': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listPayments({
        customer: optionalInput('customer-id'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Customers
  'create-customer': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createCustomer({
        email: optionalInput('email'),
        name: optionalInput('name'),
        description: optionalInput('description'),
        metadata: optionalJson('metadata'),
      }),
    )
  },
  'get-customer': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.getCustomer(core.getInput('customer-id', { required: true })),
    )
  },
  'update-customer': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.updateCustomer(core.getInput('customer-id', { required: true }), {
        email: optionalInput('email'),
        name: optionalInput('name'),
        description: optionalInput('description'),
        metadata: optionalJson('metadata'),
      }),
    )
  },
  'delete-customer': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.deleteCustomer(core.getInput('customer-id', { required: true })),
    )
  },
  'list-customers': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listCustomers({
        email: optionalInput('email'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Balance
  'get-balance': async () => {
    const client = createClient()
    setJsonOutput('result', await client.getBalance())
  },
  'list-balance-transactions': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listBalanceTransactions({
        limit: optionalNumber('limit'),
        type: optionalInput('type'),
      }),
    )
  },

  // Products
  'create-product': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createProduct({
        name: core.getInput('name', { required: true }),
        description: optionalInput('description'),
        metadata: optionalJson('metadata'),
      }),
    )
  },
  'get-product': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.getProduct(core.getInput('product-id', { required: true })),
    )
  },
  'list-products': async () => {
    const client = createClient()
    setJsonOutput('result', await client.listProducts({ limit: optionalNumber('limit') }))
  },

  // Prices
  'create-price': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createPrice({
        product: core.getInput('product-id', { required: true }),
        unitAmount: core.getInput('unit-amount', { required: true }),
        currency: optionalInput('currency'),
        recurring: optionalInput('recurring-interval'),
      }),
    )
  },
  'get-price': async () => {
    const client = createClient()
    setJsonOutput('result', await client.getPrice(core.getInput('price-id', { required: true })))
  },
  'list-prices': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listPrices({
        product: optionalInput('product-id'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Subscriptions
  'create-subscription': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createSubscription({
        customer: core.getInput('customer-id', { required: true }),
        price: core.getInput('price-id', { required: true }),
        metadata: optionalJson('metadata'),
        defaultPaymentMethod: optionalInput('default-payment-method'),
      }),
    )
  },
  'get-subscription': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.getSubscription(core.getInput('subscription-id', { required: true })),
    )
  },
  'cancel-subscription': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.cancelSubscription(core.getInput('subscription-id', { required: true })),
    )
  },
  'list-subscriptions': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listSubscriptions({
        customer: optionalInput('customer-id'),
        status: optionalInput('status'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Invoices
  'create-invoice': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createInvoice({
        customer: core.getInput('customer-id', { required: true }),
        description: optionalInput('description'),
        metadata: optionalJson('metadata'),
      }),
    )
  },
  'get-invoice': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.getInvoice(core.getInput('invoice-id', { required: true })),
    )
  },
  'pay-invoice': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.payInvoice(core.getInput('invoice-id', { required: true })),
    )
  },
  'list-invoices': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listInvoices({
        customer: optionalInput('customer-id'),
        status: optionalInput('status'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Refunds
  'create-refund': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createRefund({
        paymentIntent: core.getInput('payment-id', { required: true }),
        amount: optionalNumber('amount'),
        reason: optionalInput('reason'),
      }),
    )
  },
  'get-refund': async () => {
    const client = createClient()
    setJsonOutput('result', await client.getRefund(core.getInput('refund-id', { required: true })))
  },
  'list-refunds': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listRefunds({
        paymentIntent: optionalInput('payment-id'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Payouts
  'create-payout': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createPayout({
        amount: core.getInput('amount', { required: true }),
        currency: optionalInput('currency'),
        description: optionalInput('description'),
      }),
    )
  },
  'get-payout': async () => {
    const client = createClient()
    setJsonOutput('result', await client.getPayout(core.getInput('payout-id', { required: true })))
  },
  'cancel-payout': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.cancelPayout(core.getInput('payout-id', { required: true })),
    )
  },
  'list-payouts': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listPayouts({
        status: optionalInput('status'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Transfers (Connect)
  'create-transfer': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.createTransfer({
        amount: core.getInput('amount', { required: true }),
        currency: optionalInput('currency'),
        destination: core.getInput('destination', { required: true }),
        description: optionalInput('description'),
      }),
    )
  },
  'get-transfer': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.getTransfer(core.getInput('transfer-id', { required: true })),
    )
  },
  'list-transfers': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listTransfers({
        destination: optionalInput('destination'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Disputes
  'get-dispute': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.getDispute(core.getInput('dispute-id', { required: true })),
    )
  },
  'list-disputes': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listDisputes({
        paymentIntent: optionalInput('payment-id'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Events
  'get-event': async () => {
    const client = createClient()
    setJsonOutput('result', await client.getEvent(core.getInput('event-id', { required: true })))
  },
  'list-events': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.listEvents({
        type: optionalInput('event-type'),
        limit: optionalNumber('limit'),
      }),
    )
  },

  // Crypto Onramp
  'create-onramp-session': async () => {
    const client = createClient()
    const walletAddressesRaw = optionalJson('wallet-addresses')
    const destinationCurrenciesRaw = optionalInput('destination-currencies')
    const destinationNetworksRaw = optionalInput('destination-networks')

    setJsonOutput(
      'result',
      await client.createOnrampSession({
        walletAddresses: walletAddressesRaw,
        lockWalletAddress: optionalInput('lock-wallet-address') === 'true' ? true : undefined,
        sourceCurrency: optionalInput('source-currency'),
        sourceAmount: optionalInput('source-amount'),
        destinationCurrency: optionalInput('destination-currency'),
        destinationNetwork: optionalInput('destination-network'),
        destinationAmount: optionalInput('destination-amount'),
        destinationCurrencies: destinationCurrenciesRaw
          ? destinationCurrenciesRaw.split(',').map((s) => s.trim())
          : undefined,
        destinationNetworks: destinationNetworksRaw
          ? destinationNetworksRaw.split(',').map((s) => s.trim())
          : undefined,
        customerEmail: optionalInput('customer-email'),
        customerIpAddress: optionalInput('customer-ip-address'),
      }),
    )
  },
  'get-onramp-session': async () => {
    const client = createClient()
    setJsonOutput(
      'result',
      await client.getOnrampSession(core.getInput('session-id', { required: true })),
    )
  },
  'get-onramp-quotes': async () => {
    const client = createClient()
    const destinationCurrenciesRaw = optionalInput('destination-currencies')
    const destinationNetworksRaw = optionalInput('destination-networks')

    setJsonOutput(
      'result',
      await client.getOnrampQuotes({
        sourceCurrency: optionalInput('source-currency') || 'usd',
        sourceAmount: optionalInput('source-amount'),
        destinationAmount: optionalInput('destination-amount'),
        destinationCurrencies: destinationCurrenciesRaw
          ? destinationCurrenciesRaw.split(',').map((s) => s.trim())
          : undefined,
        destinationNetworks: destinationNetworksRaw
          ? destinationNetworksRaw.split(',').map((s) => s.trim())
          : undefined,
      }),
    )
  },
})

// -- Helpers ------------------------------------------------------------------

function createClient() {
  const timeoutInput = core.getInput('timeout')
  const maxRetriesInput = core.getInput('max-retries')
  return new StripeClient({
    apiKey: core.getInput('api-key', { required: true }),
    baseUrl: core.getInput('api-url') || undefined,
    timeout: timeoutInput ? Number(timeoutInput) : undefined,
    maxRetries: maxRetriesInput ? Number(maxRetriesInput) : undefined,
  })
}

function optionalInput(name) {
  const val = core.getInput(name)
  return val || undefined
}

function optionalNumber(name) {
  const val = core.getInput(name)
  return val ? Number(val) : undefined
}

function optionalJson(name) {
  const val = core.getInput(name)
  if (!val) return undefined
  try {
    return JSON.parse(val)
  } catch {
    throw new W3ActionError('INVALID_JSON_INPUT', `Invalid JSON in "${name}" input`)
  }
}

try {
  await router()
} catch (err) {
  if (err instanceof W3ActionError) {
    core.setFailed(`[${err.code}] ${err.message}`)
  } else {
    handleError(err)
  }
}
