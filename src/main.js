import * as core from '@actions/core'
import { StripeClient, StripeError } from './stripe.js'

const COMMANDS = {
  // Payments
  'create-payment': runCreatePayment,
  'get-payment': runGetPayment,
  'confirm-payment': runConfirmPayment,
  'capture-payment': runCapturePayment,
  'cancel-payment': runCancelPayment,
  'list-payments': runListPayments,
  // Customers
  'create-customer': runCreateCustomer,
  'get-customer': runGetCustomer,
  'update-customer': runUpdateCustomer,
  'delete-customer': runDeleteCustomer,
  'list-customers': runListCustomers,
  // Balance
  'get-balance': runGetBalance,
  'list-balance-transactions': runListBalanceTransactions,
  // Products
  'create-product': runCreateProduct,
  'get-product': runGetProduct,
  'list-products': runListProducts,
  // Prices
  'create-price': runCreatePrice,
  'get-price': runGetPrice,
  'list-prices': runListPrices,
  // Subscriptions
  'create-subscription': runCreateSubscription,
  'get-subscription': runGetSubscription,
  'cancel-subscription': runCancelSubscription,
  'list-subscriptions': runListSubscriptions,
  // Invoices
  'create-invoice': runCreateInvoice,
  'get-invoice': runGetInvoice,
  'pay-invoice': runPayInvoice,
  'list-invoices': runListInvoices,
  // Refunds
  'create-refund': runCreateRefund,
  'get-refund': runGetRefund,
  'list-refunds': runListRefunds,
  // Payouts
  'create-payout': runCreatePayout,
  'get-payout': runGetPayout,
  'cancel-payout': runCancelPayout,
  'list-payouts': runListPayouts,
  // Transfers (Connect)
  'create-transfer': runCreateTransfer,
  'get-transfer': runGetTransfer,
  'list-transfers': runListTransfers,
  // Disputes
  'get-dispute': runGetDispute,
  'list-disputes': runListDisputes,
  // Events
  'get-event': runGetEvent,
  'list-events': runListEvents,
}

export async function run() {
  try {
    const command = core.getInput('command', { required: true })
    const handler = COMMANDS[command]

    if (!handler) {
      core.setFailed(
        `Unknown command: "${command}". Available: ${Object.keys(COMMANDS).join(', ')}`,
      )
      return
    }

    const timeoutInput = core.getInput('timeout')
    const maxRetriesInput = core.getInput('max-retries')
    const client = new StripeClient({
      apiKey: core.getInput('api-key', { required: true }),
      baseUrl: core.getInput('api-url') || undefined,
      timeout: timeoutInput ? Number(timeoutInput) : undefined,
      maxRetries: maxRetriesInput ? Number(maxRetriesInput) : undefined,
    })

    const result = await handler(client)
    core.setOutput('result', JSON.stringify(result))

    writeSummary(command, result)
  } catch (error) {
    if (error instanceof StripeError) {
      core.setFailed(`Stripe error (${error.code}): ${error.message}`)
    } else {
      core.setFailed(error.message)
    }
  }
}

// -- Helpers ------------------------------------------------------------------

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
    throw new StripeError(`Invalid JSON in "${name}" input`, { code: 'INVALID_JSON_INPUT' })
  }
}

// -- Payments -----------------------------------------------------------------

async function runCreatePayment(client) {
  return client.createPayment({
    amount: core.getInput('amount', { required: true }),
    currency: optionalInput('currency'),
    customer: optionalInput('customer-id'),
    description: optionalInput('description'),
    metadata: optionalJson('metadata'),
  })
}

async function runGetPayment(client) {
  return client.getPayment(core.getInput('payment-id', { required: true }))
}

async function runConfirmPayment(client) {
  return client.confirmPayment(core.getInput('payment-id', { required: true }), {
    paymentMethod: optionalInput('payment-method'),
  })
}

async function runCapturePayment(client) {
  return client.capturePayment(core.getInput('payment-id', { required: true }), {
    amountToCapture: optionalNumber('amount'),
  })
}

async function runCancelPayment(client) {
  return client.cancelPayment(core.getInput('payment-id', { required: true }))
}

async function runListPayments(client) {
  return client.listPayments({
    customer: optionalInput('customer-id'),
    limit: optionalNumber('limit'),
  })
}

// -- Customers ----------------------------------------------------------------

async function runCreateCustomer(client) {
  return client.createCustomer({
    email: optionalInput('email'),
    name: optionalInput('name'),
    description: optionalInput('description'),
    metadata: optionalJson('metadata'),
  })
}

async function runGetCustomer(client) {
  return client.getCustomer(core.getInput('customer-id', { required: true }))
}

async function runUpdateCustomer(client) {
  return client.updateCustomer(core.getInput('customer-id', { required: true }), {
    email: optionalInput('email'),
    name: optionalInput('name'),
    description: optionalInput('description'),
    metadata: optionalJson('metadata'),
  })
}

async function runDeleteCustomer(client) {
  return client.deleteCustomer(core.getInput('customer-id', { required: true }))
}

async function runListCustomers(client) {
  return client.listCustomers({
    email: optionalInput('email'),
    limit: optionalNumber('limit'),
  })
}

// -- Balance ------------------------------------------------------------------

async function runGetBalance(client) {
  return client.getBalance()
}

async function runListBalanceTransactions(client) {
  return client.listBalanceTransactions({
    limit: optionalNumber('limit'),
    type: optionalInput('type'),
  })
}

// -- Products -----------------------------------------------------------------

async function runCreateProduct(client) {
  return client.createProduct({
    name: core.getInput('name', { required: true }),
    description: optionalInput('description'),
    metadata: optionalJson('metadata'),
  })
}

async function runGetProduct(client) {
  return client.getProduct(core.getInput('product-id', { required: true }))
}

async function runListProducts(client) {
  return client.listProducts({ limit: optionalNumber('limit') })
}

// -- Prices -------------------------------------------------------------------

async function runCreatePrice(client) {
  return client.createPrice({
    product: core.getInput('product-id', { required: true }),
    unitAmount: core.getInput('unit-amount', { required: true }),
    currency: optionalInput('currency'),
    recurring: optionalInput('recurring-interval'),
  })
}

async function runGetPrice(client) {
  return client.getPrice(core.getInput('price-id', { required: true }))
}

async function runListPrices(client) {
  return client.listPrices({
    product: optionalInput('product-id'),
    limit: optionalNumber('limit'),
  })
}

// -- Subscriptions ------------------------------------------------------------

async function runCreateSubscription(client) {
  return client.createSubscription({
    customer: core.getInput('customer-id', { required: true }),
    price: core.getInput('price-id', { required: true }),
    metadata: optionalJson('metadata'),
  })
}

async function runGetSubscription(client) {
  return client.getSubscription(core.getInput('subscription-id', { required: true }))
}

async function runCancelSubscription(client) {
  return client.cancelSubscription(core.getInput('subscription-id', { required: true }))
}

async function runListSubscriptions(client) {
  return client.listSubscriptions({
    customer: optionalInput('customer-id'),
    status: optionalInput('status'),
    limit: optionalNumber('limit'),
  })
}

// -- Invoices -----------------------------------------------------------------

async function runCreateInvoice(client) {
  return client.createInvoice({
    customer: core.getInput('customer-id', { required: true }),
    description: optionalInput('description'),
    metadata: optionalJson('metadata'),
  })
}

async function runGetInvoice(client) {
  return client.getInvoice(core.getInput('invoice-id', { required: true }))
}

async function runPayInvoice(client) {
  return client.payInvoice(core.getInput('invoice-id', { required: true }))
}

async function runListInvoices(client) {
  return client.listInvoices({
    customer: optionalInput('customer-id'),
    status: optionalInput('status'),
    limit: optionalNumber('limit'),
  })
}

// -- Refunds ------------------------------------------------------------------

async function runCreateRefund(client) {
  return client.createRefund({
    paymentIntent: core.getInput('payment-id', { required: true }),
    amount: optionalNumber('amount'),
    reason: optionalInput('reason'),
  })
}

async function runGetRefund(client) {
  return client.getRefund(core.getInput('refund-id', { required: true }))
}

async function runListRefunds(client) {
  return client.listRefunds({
    paymentIntent: optionalInput('payment-id'),
    limit: optionalNumber('limit'),
  })
}

// -- Payouts ------------------------------------------------------------------

async function runCreatePayout(client) {
  return client.createPayout({
    amount: core.getInput('amount', { required: true }),
    currency: optionalInput('currency'),
    description: optionalInput('description'),
  })
}

async function runGetPayout(client) {
  return client.getPayout(core.getInput('payout-id', { required: true }))
}

async function runCancelPayout(client) {
  return client.cancelPayout(core.getInput('payout-id', { required: true }))
}

async function runListPayouts(client) {
  return client.listPayouts({
    status: optionalInput('status'),
    limit: optionalNumber('limit'),
  })
}

// -- Transfers ----------------------------------------------------------------

async function runCreateTransfer(client) {
  return client.createTransfer({
    amount: core.getInput('amount', { required: true }),
    currency: optionalInput('currency'),
    destination: core.getInput('destination', { required: true }),
    description: optionalInput('description'),
  })
}

async function runGetTransfer(client) {
  return client.getTransfer(core.getInput('transfer-id', { required: true }))
}

async function runListTransfers(client) {
  return client.listTransfers({
    destination: optionalInput('destination'),
    limit: optionalNumber('limit'),
  })
}

// -- Disputes -----------------------------------------------------------------

async function runGetDispute(client) {
  return client.getDispute(core.getInput('dispute-id', { required: true }))
}

async function runListDisputes(client) {
  return client.listDisputes({
    paymentIntent: optionalInput('payment-id'),
    limit: optionalNumber('limit'),
  })
}

// -- Events -------------------------------------------------------------------

async function runGetEvent(client) {
  return client.getEvent(core.getInput('event-id', { required: true }))
}

async function runListEvents(client) {
  return client.listEvents({
    type: optionalInput('event-type'),
    limit: optionalNumber('limit'),
  })
}

// -- Job summary --------------------------------------------------------------

function writeSummary(command, result) {
  const heading = `Stripe: ${command}`
  core.summary
    .addHeading(heading, 3)
    .addCodeBlock(JSON.stringify(result, null, 2), 'json')
    .write()
}
