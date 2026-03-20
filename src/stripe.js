/**
 * Stripe API client.
 *
 * Uses Stripe's REST API with Basic auth (API key as username).
 * Test keys start with sk_test_, live keys with sk_live_.
 *
 * All requests use form-encoded bodies (Stripe convention).
 * All responses are JSON.
 */

const DEFAULT_BASE_URL = 'https://api.stripe.com'

export class StripeError extends Error {
  constructor(message, { status, body, code, type } = {}) {
    super(message)
    this.name = 'StripeError'
    this.status = status
    this.body = body
    this.code = code
    this.type = type
  }
}

export class StripeClient {
  constructor({ apiKey, baseUrl, timeout = 30 } = {}) {
    if (!apiKey) throw new StripeError('API key is required', { code: 'MISSING_API_KEY' })
    this.apiKey = apiKey
    this.baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : DEFAULT_BASE_URL
    this.timeout = timeout * 1000
  }

  // ---------------------------------------------------------------------------
  // Payment Intents
  // ---------------------------------------------------------------------------

  async createPayment({ amount, currency = 'usd', customer, description, metadata }) {
    if (!amount) throw new StripeError('amount is required', { code: 'MISSING_AMOUNT' })

    const params = { amount: String(amount), currency }
    if (customer) params.customer = customer
    if (description) params.description = description
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        params[`metadata[${k}]`] = v
      }
    }

    return this.request('POST', '/v1/payment_intents', params)
  }

  async getPayment(paymentId) {
    if (!paymentId) throw new StripeError('payment-id is required', { code: 'MISSING_PAYMENT_ID' })
    return this.request('GET', `/v1/payment_intents/${encodeURIComponent(paymentId)}`)
  }

  async confirmPayment(paymentId, { paymentMethod } = {}) {
    if (!paymentId) throw new StripeError('payment-id is required', { code: 'MISSING_PAYMENT_ID' })
    const params = {}
    if (paymentMethod) params.payment_method = paymentMethod
    return this.request(
      'POST',
      `/v1/payment_intents/${encodeURIComponent(paymentId)}/confirm`,
      params,
    )
  }

  async cancelPayment(paymentId) {
    if (!paymentId) throw new StripeError('payment-id is required', { code: 'MISSING_PAYMENT_ID' })
    return this.request('POST', `/v1/payment_intents/${encodeURIComponent(paymentId)}/cancel`)
  }

  // ---------------------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------------------

  async createCustomer({ email, name, description, metadata }) {
    const params = {}
    if (email) params.email = email
    if (name) params.name = name
    if (description) params.description = description
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        params[`metadata[${k}]`] = v
      }
    }
    return this.request('POST', '/v1/customers', params)
  }

  async getCustomer(customerId) {
    if (!customerId)
      throw new StripeError('customer-id is required', { code: 'MISSING_CUSTOMER_ID' })
    return this.request('GET', `/v1/customers/${encodeURIComponent(customerId)}`)
  }

  async listCustomers({ email, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (email) params.set('email', email)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/customers?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Balance
  // ---------------------------------------------------------------------------

  async getBalance() {
    return this.request('GET', '/v1/balance')
  }

  // ---------------------------------------------------------------------------
  // Refunds
  // ---------------------------------------------------------------------------

  async createRefund({ paymentIntent, amount, reason }) {
    if (!paymentIntent)
      throw new StripeError('payment-id is required for refund', { code: 'MISSING_PAYMENT_ID' })
    const params = { payment_intent: paymentIntent }
    if (amount) params.amount = String(amount)
    if (reason) params.reason = reason
    return this.request('POST', '/v1/refunds', params)
  }

  async getRefund(refundId) {
    if (!refundId) throw new StripeError('refund-id is required', { code: 'MISSING_REFUND_ID' })
    return this.request('GET', `/v1/refunds/${encodeURIComponent(refundId)}`)
  }

  // ---------------------------------------------------------------------------
  // Payouts
  // ---------------------------------------------------------------------------

  async createPayout({ amount, currency = 'usd', description }) {
    if (!amount) throw new StripeError('amount is required', { code: 'MISSING_AMOUNT' })
    const params = { amount: String(amount), currency }
    if (description) params.description = description
    return this.request('POST', '/v1/payouts', params)
  }

  async getPayout(payoutId) {
    if (!payoutId) throw new StripeError('payout-id is required', { code: 'MISSING_PAYOUT_ID' })
    return this.request('GET', `/v1/payouts/${encodeURIComponent(payoutId)}`)
  }

  // ---------------------------------------------------------------------------
  // HTTP
  // ---------------------------------------------------------------------------

  async request(method, path, params) {
    const url = `${this.baseUrl}${path}`
    const headers = {
      Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
      Accept: 'application/json',
    }

    const options = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    }

    if (params && method === 'POST') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      options.body = new URLSearchParams(params).toString()
    }

    const response = await fetch(url, options)
    const text = await response.text()

    if (!response.ok) {
      let errorMessage = `Stripe API error: ${response.status}`
      let errorCode = 'API_ERROR'
      let errorType = undefined
      try {
        const err = JSON.parse(text)
        if (err.error) {
          if (err.error.message) errorMessage = err.error.message
          if (err.error.code) errorCode = err.error.code
          if (err.error.type) errorType = err.error.type
        }
      } catch {
        // use defaults
      }
      throw new StripeError(errorMessage, {
        status: response.status,
        body: text,
        code: errorCode,
        type: errorType,
      })
    }

    if (!text || !text.trim()) return {}

    try {
      return JSON.parse(text)
    } catch {
      throw new StripeError('Invalid JSON from Stripe API', {
        status: response.status,
        body: text,
        code: 'PARSE_ERROR',
      })
    }
  }
}
