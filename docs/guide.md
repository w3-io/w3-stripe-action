---
title: Stripe
category: integrations
actions:
  [
    create-payment,
    get-payment,
    confirm-payment,
    capture-payment,
    cancel-payment,
    list-payments,
    create-customer,
    get-customer,
    update-customer,
    delete-customer,
    list-customers,
    get-balance,
    list-balance-transactions,
    create-product,
    get-product,
    list-products,
    create-price,
    get-price,
    list-prices,
    create-subscription,
    get-subscription,
    cancel-subscription,
    list-subscriptions,
    create-invoice,
    get-invoice,
    pay-invoice,
    list-invoices,
    create-refund,
    get-refund,
    list-refunds,
    create-payout,
    get-payout,
    cancel-payout,
    list-payouts,
    create-transfer,
    get-transfer,
    list-transfers,
  ]
complexity: beginner
---

# Stripe

[Stripe](https://stripe.com) is a payments infrastructure platform used by
millions of businesses from startups to Fortune 500 companies. It processes
hundreds of billions of dollars annually across 135+ currencies with PCI DSS
Level 1 certification — the highest level of payment security compliance.
Use this action to create payment intents, manage customers, issue refunds,
check balances, and trigger payouts from automated workflows.

Create and manage Stripe payments, customers, refunds, payouts, and balances
via the Stripe REST API.

## Quick start

```yaml
- name: Create payment
  id: payment
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-payment
    api-key: ${{ secrets.STRIPE_API_KEY }}
    amount: '1000'
    currency: 'usd'
    description: 'Order #12345'
```

## Payment commands

### create-payment

Create a payment intent. Amount is in the smallest currency unit (cents for USD).

| Input         | Required | Description                      |
| ------------- | -------- | -------------------------------- |
| `amount`      | yes      | Amount in cents (1000 = $10.00)  |
| `currency`    | no       | ISO currency code (default: usd) |
| `customer-id` | no       | Attach to a customer (cus\_...)  |
| `description` | no       | Payment description              |
| `metadata`    | no       | JSON key-value metadata          |

**Output (`result`):**

```json
{
  "id": "pi_3abc123",
  "status": "requires_payment_method",
  "amount": 1000,
  "currency": "usd",
  "client_secret": "pi_3abc123_secret_xyz"
}
```

### get-payment

Retrieve a payment intent by ID.

| Input        | Required | Description                 |
| ------------ | -------- | --------------------------- |
| `payment-id` | yes      | Payment intent ID (pi\_...) |

**Output (`result`):**

```json
{
  "id": "pi_3abc123",
  "status": "succeeded",
  "amount": 1000,
  "currency": "usd"
}
```

### confirm-payment

Confirm a payment intent server-side.

| Input            | Required | Description                 |
| ---------------- | -------- | --------------------------- |
| `payment-id`     | yes      | Payment intent ID (pi\_...) |
| `payment-method` | no       | Payment method ID (pm\_...) |

### capture-payment

Capture a previously authorized payment (for auth-then-capture flows).

| Input        | Required | Description                     |
| ------------ | -------- | ------------------------------- |
| `payment-id` | yes      | Payment intent ID (pi\_...)     |
| `amount`     | no       | Partial capture amount in cents |

### cancel-payment

Cancel a payment intent.

| Input        | Required | Description                 |
| ------------ | -------- | --------------------------- |
| `payment-id` | yes      | Payment intent ID (pi\_...) |

### list-payments

List payment intents with optional customer filter.

| Input         | Required | Description               |
| ------------- | -------- | ------------------------- |
| `customer-id` | no       | Filter by customer        |
| `limit`       | no       | Max results (default: 10) |

**Output:** `{data: [...], has_more}`

## Customer commands

### create-customer

Create a Stripe customer for recurring billing or payment tracking.

| Input         | Required | Description             |
| ------------- | -------- | ----------------------- |
| `email`       | no       | Customer email          |
| `name`        | no       | Customer name           |
| `description` | no       | Description             |
| `metadata`    | no       | JSON key-value metadata |

**Output (`result`):**

```json
{
  "id": "cus_abc123",
  "email": "user@example.com",
  "name": "Jane Doe",
  "created": 1711000000
}
```

### get-customer

| Input         | Required | Description            |
| ------------- | -------- | ---------------------- |
| `customer-id` | yes      | Customer ID (cus\_...) |

### update-customer

| Input         | Required | Description             |
| ------------- | -------- | ----------------------- |
| `customer-id` | yes      | Customer ID (cus\_...)  |
| `email`       | no       | New email               |
| `name`        | no       | New name                |
| `description` | no       | New description         |
| `metadata`    | no       | JSON key-value metadata |

### delete-customer

| Input         | Required | Description            |
| ------------- | -------- | ---------------------- |
| `customer-id` | yes      | Customer ID (cus\_...) |

**Output:** `{id, deleted: true}`

### list-customers

| Input   | Required | Description               |
| ------- | -------- | ------------------------- |
| `email` | no       | Filter by exact email     |
| `limit` | no       | Max results (default: 10) |

**Output (`result`):**

```json
{
  "data": [{ "id": "cus_abc123", "email": "user@example.com" }],
  "has_more": false
}
```

## Balance commands

### get-balance

Retrieve your Stripe account balance. No inputs required.

**Output (`result`):**

```json
{
  "available": [{ "amount": 50000, "currency": "usd" }],
  "pending": [{ "amount": 12000, "currency": "usd" }]
}
```

### list-balance-transactions

List balance transactions for reconciliation and accounting.

| Input   | Required | Description                                    |
| ------- | -------- | ---------------------------------------------- |
| `type`  | no       | Filter: charge, refund, payout, transfer, etc. |
| `limit` | no       | Max results (default: 10)                      |

**Output:** `{data: [{id, amount, type, created}], has_more}`

## Product commands

### create-product

Create a product (required before creating prices or subscriptions).

| Input         | Required | Description             |
| ------------- | -------- | ----------------------- |
| `name`        | yes      | Product name            |
| `description` | no       | Product description     |
| `metadata`    | no       | JSON key-value metadata |

**Output (`result`):**

```json
{
  "id": "prod_abc123",
  "name": "Pro Plan",
  "description": "Monthly pro subscription"
}
```

### get-product

| Input        | Required | Description            |
| ------------ | -------- | ---------------------- |
| `product-id` | yes      | Product ID (prod\_...) |

### list-products

| Input   | Required | Description               |
| ------- | -------- | ------------------------- |
| `limit` | no       | Max results (default: 10) |

## Price commands

### create-price

Create a price for a product. Set `recurring-interval` for subscription prices.

| Input                | Required | Description                      |
| -------------------- | -------- | -------------------------------- |
| `product-id`         | yes      | Product to price (prod\_...)     |
| `unit-amount`        | yes      | Price per unit in cents          |
| `currency`           | no       | ISO currency code (default: usd) |
| `recurring-interval` | no       | day, week, month, or year        |

**Output (`result`):**

```json
{
  "id": "price_abc123",
  "product": "prod_abc123",
  "unit_amount": 999,
  "currency": "usd",
  "recurring": { "interval": "month" }
}
```

### get-price

| Input      | Required | Description           |
| ---------- | -------- | --------------------- |
| `price-id` | yes      | Price ID (price\_...) |

### list-prices

| Input        | Required | Description               |
| ------------ | -------- | ------------------------- |
| `product-id` | no       | Filter by product         |
| `limit`      | no       | Max results (default: 10) |

## Subscription commands

### create-subscription

Create a recurring subscription for a customer.

| Input         | Required | Description                     |
| ------------- | -------- | ------------------------------- |
| `customer-id` | yes      | Customer ID (cus\_...)          |
| `price-id`    | yes      | Recurring price ID (price\_...) |
| `metadata`    | no       | JSON key-value metadata         |

**Output (`result`):**

```json
{
  "id": "sub_abc123",
  "status": "active",
  "customer": "cus_abc123",
  "current_period_start": 1711000000,
  "current_period_end": 1713600000
}
```

### get-subscription

| Input             | Required | Description                |
| ----------------- | -------- | -------------------------- |
| `subscription-id` | yes      | Subscription ID (sub\_...) |

### cancel-subscription

| Input             | Required | Description                |
| ----------------- | -------- | -------------------------- |
| `subscription-id` | yes      | Subscription ID (sub\_...) |

**Output:** `{id, status: "canceled"}`

### list-subscriptions

| Input         | Required | Description                        |
| ------------- | -------- | ---------------------------------- |
| `customer-id` | no       | Filter by customer                 |
| `status`      | no       | Filter: active, canceled, past_due |
| `limit`       | no       | Max results (default: 10)          |

## Invoice commands

### create-invoice

Create a draft invoice for a customer.

| Input         | Required | Description             |
| ------------- | -------- | ----------------------- |
| `customer-id` | yes      | Customer ID (cus\_...)  |
| `description` | no       | Invoice description     |
| `metadata`    | no       | JSON key-value metadata |

**Output (`result`):**

```json
{
  "id": "in_abc123",
  "status": "draft",
  "customer": "cus_abc123",
  "total": 0
}
```

### get-invoice

| Input        | Required | Description          |
| ------------ | -------- | -------------------- |
| `invoice-id` | yes      | Invoice ID (in\_...) |

### pay-invoice

Pay an open invoice.

| Input        | Required | Description          |
| ------------ | -------- | -------------------- |
| `invoice-id` | yes      | Invoice ID (in\_...) |

**Output:** `{id, status: "paid", amount_paid}`

### list-invoices

| Input         | Required | Description                     |
| ------------- | -------- | ------------------------------- |
| `customer-id` | no       | Filter by customer              |
| `status`      | no       | Filter: draft, open, paid, void |
| `limit`       | no       | Max results (default: 10)       |

## Refund commands

### create-refund

Refund a payment intent (full or partial).

| Input        | Required | Description                                     |
| ------------ | -------- | ----------------------------------------------- |
| `payment-id` | yes      | Payment intent to refund (pi\_...)              |
| `amount`     | no       | Partial refund in cents (omit for full)         |
| `reason`     | no       | duplicate, fraudulent, or requested_by_customer |

**Output (`result`):**

```json
{
  "id": "re_abc123",
  "status": "succeeded",
  "amount": 1000,
  "payment_intent": "pi_3abc123"
}
```

### get-refund

| Input       | Required | Description         |
| ----------- | -------- | ------------------- |
| `refund-id` | yes      | Refund ID (re\_...) |

### list-refunds

| Input        | Required | Description               |
| ------------ | -------- | ------------------------- |
| `payment-id` | no       | Filter by payment intent  |
| `limit`      | no       | Max results (default: 10) |

## Payout commands

### create-payout

Send funds to your connected bank account or debit card.

| Input         | Required | Description             |
| ------------- | -------- | ----------------------- |
| `amount`      | yes      | Amount in cents         |
| `currency`    | no       | Currency (default: usd) |
| `description` | no       | Payout description      |

**Output (`result`):**

```json
{
  "id": "po_abc123",
  "status": "pending",
  "amount": 50000,
  "currency": "usd",
  "arrival_date": 1711100000
}
```

### get-payout

| Input       | Required | Description         |
| ----------- | -------- | ------------------- |
| `payout-id` | yes      | Payout ID (po\_...) |

### cancel-payout

Cancel a pending payout.

| Input       | Required | Description         |
| ----------- | -------- | ------------------- |
| `payout-id` | yes      | Payout ID (po\_...) |

### list-payouts

| Input    | Required | Description               |
| -------- | -------- | ------------------------- |
| `status` | no       | Filter: pending, paid     |
| `limit`  | no       | Max results (default: 10) |

## Transfer commands (Connect)

### create-transfer

Transfer funds to a connected Stripe account (for marketplaces).

| Input         | Required | Description                      |
| ------------- | -------- | -------------------------------- |
| `amount`      | yes      | Amount in cents                  |
| `currency`    | no       | Currency (default: usd)          |
| `destination` | yes      | Connected account ID (acct\_...) |
| `description` | no       | Transfer description             |

**Output (`result`):**

```json
{
  "id": "tr_abc123",
  "amount": 1000,
  "destination": "acct_abc123",
  "created": 1711000000
}
```

### get-transfer

| Input         | Required | Description           |
| ------------- | -------- | --------------------- |
| `transfer-id` | yes      | Transfer ID (tr\_...) |

### list-transfers

| Input         | Required | Description               |
| ------------- | -------- | ------------------------- |
| `destination` | no       | Filter by connected acct  |
| `limit`       | no       | Max results (default: 10) |

## Subscription workflow example

```yaml
- name: Create product
  id: product
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-product
    api-key: ${{ secrets.STRIPE_API_KEY }}
    name: 'Pro Plan'

- name: Create monthly price
  id: price
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-price
    api-key: ${{ secrets.STRIPE_API_KEY }}
    product-id: ${{ fromJSON(steps.product.outputs.result).id }}
    unit-amount: '2999'
    recurring-interval: 'month'

- name: Subscribe customer
  id: sub
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-subscription
    api-key: ${{ secrets.STRIPE_API_KEY }}
    customer-id: ${{ steps.customer.outputs.customer_id }}
    price-id: ${{ fromJSON(steps.price.outputs.result).id }}
```

## Payment workflow example

```yaml
- name: Create customer
  id: customer
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-customer
    api-key: ${{ secrets.STRIPE_API_KEY }}
    email: ${{ github.event.inputs.email }}
    name: ${{ github.event.inputs.name }}

- name: Create payment
  id: payment
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-payment
    api-key: ${{ secrets.STRIPE_API_KEY }}
    amount: '5000'
    customer-id: ${{ fromJSON(steps.customer.outputs.result).id }}
    description: 'Subscription payment'

- name: Check payment status
  id: status
  uses: w3-io/w3-stripe-action@v0
  with:
    command: get-payment
    api-key: ${{ secrets.STRIPE_API_KEY }}
    payment-id: ${{ fromJSON(steps.payment.outputs.result).id }}
```

## Beyond this W3 integration

This action covers Stripe's core platform with 37 commands. Stripe
capabilities not exposed here:

| Layer           | What                                                                                                 | Status              |
| --------------- | ---------------------------------------------------------------------------------------------------- | ------------------- |
| This action     | Payments, customers, subscriptions, invoices, products, prices, refunds, payouts, balance, transfers | Available           |
| Stripe Checkout | Hosted payment pages                                                                                 | Not applicable (UI) |
| Stripe Radar    | ML fraud detection                                                                                   | Not yet exposed     |
| Stripe Treasury | Banking-as-a-service, financial accounts                                                             | Not yet exposed     |
| Stripe Identity | ID verification                                                                                      | Not yet exposed     |

For the full platform, see [stripe.com/docs](https://stripe.com/docs).

## Authentication

Get your API key from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys).

- **Test keys** start with `sk_test_` — use for development
- **Live keys** start with `sk_live_` — use for production

```yaml
with:
  api-key: ${{ secrets.STRIPE_API_KEY }}
```

## Security

**Amount inputs.** The `amount` input is passed as a form-encoded
integer to Stripe's API — not interpolated into URLs or queries.
Stripe validates amounts server-side. If constructing amounts from
user input, validate they are positive integers before passing them
to the action.

**API keys.** Stripe secret keys grant full account access. Store
them as GitHub secrets, never log them, and use test keys during
development. Restrict live keys with [Stripe's restricted key
feature](https://stripe.com/docs/keys#limit-access) to only the
permissions your workflow needs.

## Error handling

The action fails with a descriptive message on:

- Missing or invalid API key
- Missing required inputs (amount, payment-id, etc.)
- Stripe API errors (card_declined, insufficient_funds, etc.)
- Invalid response format
