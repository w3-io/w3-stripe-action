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
  constructor({ apiKey, baseUrl, timeout = 30, maxRetries = 3 } = {}) {
    if (!apiKey) throw new StripeError('API key is required', { code: 'MISSING_API_KEY' })
    this.apiKey = apiKey
    this.authHeader = `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
    this.baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : DEFAULT_BASE_URL
    this.timeout = timeout * 1000
    this.maxRetries = maxRetries
  }

  /**
   * Flatten metadata into Stripe's bracket notation, coercing values to strings.
   */
  static applyMetadata(params, metadata) {
    if (!metadata) return
    for (const [k, v] of Object.entries(metadata)) {
      params[`metadata[${k}]`] = String(v)
    }
  }

  // ---------------------------------------------------------------------------
  // Payment Intents
  // ---------------------------------------------------------------------------

  async createPayment({
    amount,
    currency = 'usd',
    customer,
    description,
    metadata,
    captureMethod,
  }) {
    if (amount == null) throw new StripeError('amount is required', { code: 'MISSING_AMOUNT' })

    // Use automatic_payment_methods with allow_redirects=never so we
    // don't need a return_url for Card-and-similar flows. This replaces
    // the deprecated `payment_method_types[]=card`, which Stripe now
    // ignores in favor of Dashboard-enabled methods (including those
    // that require redirects).
    const params = {
      amount: String(amount),
      currency,
      'automatic_payment_methods[enabled]': 'true',
      'automatic_payment_methods[allow_redirects]': 'never',
    }
    if (customer) params.customer = customer
    if (description) params.description = description
    if (captureMethod) params.capture_method = captureMethod
    StripeClient.applyMetadata(params, metadata)

    return this.request('POST', '/v1/payment_intents', params)
  }

  async getPayment(paymentId) {
    if (!paymentId) throw new StripeError('payment-id is required', { code: 'MISSING_PAYMENT_ID' })
    return this.request('GET', `/v1/payment_intents/${encodeURIComponent(paymentId)}`)
  }

  async confirmPayment(paymentId, { paymentMethod } = {}) {
    if (!paymentId) throw new StripeError('payment-id is required', { code: 'MISSING_PAYMENT_ID' })
    const params = paymentMethod ? { payment_method: paymentMethod } : undefined
    return this.request(
      'POST',
      `/v1/payment_intents/${encodeURIComponent(paymentId)}/confirm`,
      params,
    )
  }

  async capturePayment(paymentId, { amountToCapture } = {}) {
    if (!paymentId) throw new StripeError('payment-id is required', { code: 'MISSING_PAYMENT_ID' })
    const params =
      amountToCapture != null ? { amount_to_capture: String(amountToCapture) } : undefined
    return this.request(
      'POST',
      `/v1/payment_intents/${encodeURIComponent(paymentId)}/capture`,
      params,
    )
  }

  async cancelPayment(paymentId) {
    if (!paymentId) throw new StripeError('payment-id is required', { code: 'MISSING_PAYMENT_ID' })
    return this.request('POST', `/v1/payment_intents/${encodeURIComponent(paymentId)}/cancel`)
  }

  async listPayments({ customer, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (customer) params.set('customer', customer)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/payment_intents?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------------------

  async createCustomer({ email, name, description, metadata }) {
    const params = {}
    if (email) params.email = email
    if (name) params.name = name
    if (description) params.description = description
    StripeClient.applyMetadata(params, metadata)
    return this.request('POST', '/v1/customers', params)
  }

  async getCustomer(customerId) {
    if (!customerId)
      throw new StripeError('customer-id is required', { code: 'MISSING_CUSTOMER_ID' })
    return this.request('GET', `/v1/customers/${encodeURIComponent(customerId)}`)
  }

  async updateCustomer(customerId, { email, name, description, metadata }) {
    if (!customerId)
      throw new StripeError('customer-id is required', { code: 'MISSING_CUSTOMER_ID' })
    const params = {}
    if (email) params.email = email
    if (name) params.name = name
    if (description) params.description = description
    StripeClient.applyMetadata(params, metadata)
    return this.request('POST', `/v1/customers/${encodeURIComponent(customerId)}`, params)
  }

  async deleteCustomer(customerId) {
    if (!customerId)
      throw new StripeError('customer-id is required', { code: 'MISSING_CUSTOMER_ID' })
    return this.request('DELETE', `/v1/customers/${encodeURIComponent(customerId)}`)
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

  async listBalanceTransactions({ limit = 10, type } = {}) {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    if (type) params.set('type', type)
    return this.request('GET', `/v1/balance_transactions?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Products & Prices
  // ---------------------------------------------------------------------------

  async createProduct({ name, description, metadata }) {
    if (!name) throw new StripeError('name is required', { code: 'MISSING_NAME' })
    const params = { name }
    if (description) params.description = description
    StripeClient.applyMetadata(params, metadata)
    return this.request('POST', '/v1/products', params)
  }

  async getProduct(productId) {
    if (!productId) throw new StripeError('product-id is required', { code: 'MISSING_PRODUCT_ID' })
    return this.request('GET', `/v1/products/${encodeURIComponent(productId)}`)
  }

  async listProducts({ limit = 10 } = {}) {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    return this.request('GET', `/v1/products?${params.toString()}`)
  }

  async createPrice({ product, unitAmount, currency = 'usd', recurring }) {
    if (!product) throw new StripeError('product-id is required', { code: 'MISSING_PRODUCT_ID' })
    if (unitAmount == null)
      throw new StripeError('unit-amount is required', { code: 'MISSING_UNIT_AMOUNT' })
    const params = {
      product,
      unit_amount: String(unitAmount),
      currency,
    }
    if (recurring) {
      params['recurring[interval]'] = recurring
    }
    return this.request('POST', '/v1/prices', params)
  }

  async getPrice(priceId) {
    if (!priceId) throw new StripeError('price-id is required', { code: 'MISSING_PRICE_ID' })
    return this.request('GET', `/v1/prices/${encodeURIComponent(priceId)}`)
  }

  async listPrices({ product, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (product) params.set('product', product)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/prices?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  async createSubscription({ customer, price, metadata, defaultPaymentMethod }) {
    if (!customer) throw new StripeError('customer-id is required', { code: 'MISSING_CUSTOMER_ID' })
    if (!price) throw new StripeError('price-id is required', { code: 'MISSING_PRICE_ID' })
    const params = { customer, 'items[0][price]': price }
    if (defaultPaymentMethod) params.default_payment_method = defaultPaymentMethod
    StripeClient.applyMetadata(params, metadata)
    return this.request('POST', '/v1/subscriptions', params)
  }

  async getSubscription(subscriptionId) {
    if (!subscriptionId)
      throw new StripeError('subscription-id is required', { code: 'MISSING_SUBSCRIPTION_ID' })
    return this.request('GET', `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`)
  }

  async cancelSubscription(subscriptionId) {
    if (!subscriptionId)
      throw new StripeError('subscription-id is required', { code: 'MISSING_SUBSCRIPTION_ID' })
    return this.request('DELETE', `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`)
  }

  async listSubscriptions({ customer, status, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (customer) params.set('customer', customer)
    if (status) params.set('status', status)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/subscriptions?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Invoices
  // ---------------------------------------------------------------------------

  async createInvoice({ customer, description, metadata }) {
    if (!customer) throw new StripeError('customer-id is required', { code: 'MISSING_CUSTOMER_ID' })
    const params = { customer }
    if (description) params.description = description
    StripeClient.applyMetadata(params, metadata)
    return this.request('POST', '/v1/invoices', params)
  }

  async getInvoice(invoiceId) {
    if (!invoiceId) throw new StripeError('invoice-id is required', { code: 'MISSING_INVOICE_ID' })
    return this.request('GET', `/v1/invoices/${encodeURIComponent(invoiceId)}`)
  }

  async payInvoice(invoiceId) {
    if (!invoiceId) throw new StripeError('invoice-id is required', { code: 'MISSING_INVOICE_ID' })
    return this.request('POST', `/v1/invoices/${encodeURIComponent(invoiceId)}/pay`)
  }

  async listInvoices({ customer, status, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (customer) params.set('customer', customer)
    if (status) params.set('status', status)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/invoices?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Refunds
  // ---------------------------------------------------------------------------

  async createRefund({ paymentIntent, amount, reason }) {
    if (!paymentIntent)
      throw new StripeError('payment-id is required for refund', { code: 'MISSING_PAYMENT_ID' })
    const params = { payment_intent: paymentIntent }
    if (amount != null) params.amount = String(amount)
    if (reason) params.reason = reason
    return this.request('POST', '/v1/refunds', params)
  }

  async getRefund(refundId) {
    if (!refundId) throw new StripeError('refund-id is required', { code: 'MISSING_REFUND_ID' })
    return this.request('GET', `/v1/refunds/${encodeURIComponent(refundId)}`)
  }

  async listRefunds({ paymentIntent, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (paymentIntent) params.set('payment_intent', paymentIntent)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/refunds?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Payouts
  // ---------------------------------------------------------------------------

  async createPayout({ amount, currency = 'usd', description }) {
    if (amount == null) throw new StripeError('amount is required', { code: 'MISSING_AMOUNT' })
    const params = { amount: String(amount), currency }
    if (description) params.description = description
    return this.request('POST', '/v1/payouts', params)
  }

  async getPayout(payoutId) {
    if (!payoutId) throw new StripeError('payout-id is required', { code: 'MISSING_PAYOUT_ID' })
    return this.request('GET', `/v1/payouts/${encodeURIComponent(payoutId)}`)
  }

  async cancelPayout(payoutId) {
    if (!payoutId) throw new StripeError('payout-id is required', { code: 'MISSING_PAYOUT_ID' })
    return this.request('POST', `/v1/payouts/${encodeURIComponent(payoutId)}/cancel`)
  }

  async listPayouts({ status, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/payouts?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Transfers (Connect)
  // ---------------------------------------------------------------------------

  async createTransfer({ amount, currency = 'usd', destination, description }) {
    if (amount == null) throw new StripeError('amount is required', { code: 'MISSING_AMOUNT' })
    if (!destination)
      throw new StripeError('destination is required', { code: 'MISSING_DESTINATION' })
    const params = { amount: String(amount), currency, destination }
    if (description) params.description = description
    return this.request('POST', '/v1/transfers', params)
  }

  async getTransfer(transferId) {
    if (!transferId)
      throw new StripeError('transfer-id is required', { code: 'MISSING_TRANSFER_ID' })
    return this.request('GET', `/v1/transfers/${encodeURIComponent(transferId)}`)
  }

  async listTransfers({ destination, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (destination) params.set('destination', destination)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/transfers?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Disputes
  // ---------------------------------------------------------------------------

  async getDispute(disputeId) {
    if (!disputeId) throw new StripeError('dispute-id is required', { code: 'MISSING_DISPUTE_ID' })
    return this.request('GET', `/v1/disputes/${encodeURIComponent(disputeId)}`)
  }

  async listDisputes({ paymentIntent, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (paymentIntent) params.set('payment_intent', paymentIntent)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/disputes?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  async getEvent(eventId) {
    if (!eventId) throw new StripeError('event-id is required', { code: 'MISSING_EVENT_ID' })
    return this.request('GET', `/v1/events/${encodeURIComponent(eventId)}`)
  }

  async listEvents({ type, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    params.set('limit', String(limit))
    return this.request('GET', `/v1/events?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Crypto Onramp
  // ---------------------------------------------------------------------------

  async createOnrampSession({
    walletAddresses,
    lockWalletAddress,
    sourceCurrency,
    sourceAmount,
    destinationCurrency,
    destinationNetwork,
    destinationAmount,
    destinationCurrencies,
    destinationNetworks,
    customerEmail,
    customerIpAddress,
  }) {
    const params = {}
    if (walletAddresses) {
      for (const [network, address] of Object.entries(walletAddresses)) {
        params[`wallet_addresses[${network}]`] = address
      }
    }
    if (lockWalletAddress != null) params.lock_wallet_address = String(lockWalletAddress)
    if (sourceCurrency) params.source_currency = sourceCurrency
    if (sourceAmount) params.source_amount = sourceAmount
    if (destinationCurrency) params.destination_currency = destinationCurrency
    if (destinationNetwork) params.destination_network = destinationNetwork
    if (destinationAmount) params.destination_amount = destinationAmount
    if (destinationCurrencies) {
      destinationCurrencies.forEach((c, i) => {
        params[`destination_currencies[${i}]`] = c
      })
    }
    if (destinationNetworks) {
      destinationNetworks.forEach((n, i) => {
        params[`destination_networks[${i}]`] = n
      })
    }
    if (customerEmail) params['customer_information[email]'] = customerEmail
    if (customerIpAddress) params.customer_ip_address = customerIpAddress
    return this.request('POST', '/v1/crypto/onramp_sessions', params)
  }

  async getOnrampSession(sessionId) {
    if (!sessionId) throw new StripeError('session-id is required', { code: 'MISSING_SESSION_ID' })
    return this.request('GET', `/v1/crypto/onramp_sessions/${encodeURIComponent(sessionId)}`)
  }

  async getOnrampQuotes({
    sourceCurrency = 'usd',
    sourceAmount,
    destinationAmount,
    destinationCurrencies,
    destinationNetworks,
  } = {}) {
    const params = new URLSearchParams()
    params.set('source_currency', sourceCurrency)
    if (sourceAmount) params.set('source_amount', sourceAmount)
    if (destinationAmount) params.set('destination_amount', destinationAmount)
    if (destinationCurrencies) {
      destinationCurrencies.forEach((c, i) => {
        params.set(`destination_currencies[${i}]`, c)
      })
    }
    if (destinationNetworks) {
      destinationNetworks.forEach((n, i) => {
        params.set(`destination_networks[${i}]`, n)
      })
    }
    return this.request('GET', `/v1/crypto/onramp/quotes?${params.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // HTTP
  // ---------------------------------------------------------------------------

  async request(method, path, params) {
    const url = `${this.baseUrl}${path}`

    // Idempotency key for POST requests — prevents duplicate charges on retry
    const idempotencyKey = method === 'POST' ? crypto.randomUUID() : undefined

    let lastError
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
        const jitter = Math.random() * delay * 0.5
        await new Promise((resolve) => setTimeout(resolve, delay + jitter))
      }

      const headers = {
        Authorization: this.authHeader,
        Accept: 'application/json',
      }

      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

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

      // Retry on 429 (rate limit) and 5xx (server error)
      if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
        lastError = new StripeError(`Stripe API error: ${response.status}`, {
          status: response.status,
          body: text,
          code: response.status === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR',
        })
        continue
      }

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

    throw lastError
  }
}
