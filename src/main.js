import * as core from '@actions/core'
import { StripeClient, StripeError } from './stripe.js'

const COMMANDS = {
  // Payments
  'create-payment': runCreatePayment,
  'get-payment': runGetPayment,
  'confirm-payment': runConfirmPayment,
  'cancel-payment': runCancelPayment,
  // Customers
  'create-customer': runCreateCustomer,
  'get-customer': runGetCustomer,
  'list-customers': runListCustomers,
  // Balance
  'get-balance': runGetBalance,
  // Refunds
  'create-refund': runCreateRefund,
  'get-refund': runGetRefund,
  // Payouts
  'create-payout': runCreatePayout,
  'get-payout': runGetPayout,
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
    const client = new StripeClient({
      apiKey: core.getInput('api-key', { required: true }),
      baseUrl: core.getInput('api-url') || undefined,
      timeout: timeoutInput ? Number(timeoutInput) : undefined,
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

// -- Payments -----------------------------------------------------------------

async function runCreatePayment(client) {
  const amount = core.getInput('amount', { required: true })
  const currency = core.getInput('currency') || undefined
  const customer = core.getInput('customer-id') || undefined
  const description = core.getInput('description') || undefined
  const metadataRaw = core.getInput('metadata') || undefined
  const metadata = metadataRaw ? JSON.parse(metadataRaw) : undefined
  return client.createPayment({ amount, currency, customer, description, metadata })
}

async function runGetPayment(client) {
  const paymentId = core.getInput('payment-id', { required: true })
  return client.getPayment(paymentId)
}

async function runConfirmPayment(client) {
  const paymentId = core.getInput('payment-id', { required: true })
  const paymentMethod = core.getInput('payment-method') || undefined
  return client.confirmPayment(paymentId, { paymentMethod })
}

async function runCancelPayment(client) {
  const paymentId = core.getInput('payment-id', { required: true })
  return client.cancelPayment(paymentId)
}

// -- Customers ----------------------------------------------------------------

async function runCreateCustomer(client) {
  const email = core.getInput('email') || undefined
  const name = core.getInput('name') || undefined
  const description = core.getInput('description') || undefined
  const metadataRaw = core.getInput('metadata') || undefined
  const metadata = metadataRaw ? JSON.parse(metadataRaw) : undefined
  return client.createCustomer({ email, name, description, metadata })
}

async function runGetCustomer(client) {
  const customerId = core.getInput('customer-id', { required: true })
  return client.getCustomer(customerId)
}

async function runListCustomers(client) {
  const email = core.getInput('email') || undefined
  const limitInput = core.getInput('limit')
  const limit = limitInput ? Number(limitInput) : undefined
  return client.listCustomers({ email, limit })
}

// -- Balance ------------------------------------------------------------------

async function runGetBalance(client) {
  return client.getBalance()
}

// -- Refunds ------------------------------------------------------------------

async function runCreateRefund(client) {
  const paymentIntent = core.getInput('payment-id', { required: true })
  const amountInput = core.getInput('amount')
  const amount = amountInput ? Number(amountInput) : undefined
  const reason = core.getInput('reason') || undefined
  return client.createRefund({ paymentIntent, amount, reason })
}

async function runGetRefund(client) {
  const refundId = core.getInput('refund-id', { required: true })
  return client.getRefund(refundId)
}

// -- Payouts ------------------------------------------------------------------

async function runCreatePayout(client) {
  const amount = core.getInput('amount', { required: true })
  const currency = core.getInput('currency') || undefined
  const description = core.getInput('description') || undefined
  return client.createPayout({ amount, currency, description })
}

async function runGetPayout(client) {
  const payoutId = core.getInput('payout-id', { required: true })
  return client.getPayout(payoutId)
}

// -- Job summary --------------------------------------------------------------

function writeSummary(command, result) {
  const heading = `Stripe: ${command}`
  core.summary
    .addHeading(heading, 3)
    .addCodeBlock(JSON.stringify(result, null, 2), 'json')
    .write()
}
