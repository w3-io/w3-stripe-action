---
title: Stripe
category: integrations
actions:
  [
    create-payment,
    get-payment,
    confirm-payment,
    cancel-payment,
    create-customer,
    get-customer,
    list-customers,
    get-balance,
    create-refund,
    get-refund,
    create-payout,
    get-payout,
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

### cancel-payment

Cancel a payment intent.

| Input        | Required | Description                 |
| ------------ | -------- | --------------------------- |
| `payment-id` | yes      | Payment intent ID (pi\_...) |

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

This action covers Stripe's core payment operations. Stripe's full
platform includes capabilities not exposed here:

| Layer           | What                                           | Status              |
| --------------- | ---------------------------------------------- | ------------------- |
| This action     | Payments, customers, refunds, payouts, balance | Available           |
| Stripe Connect  | Multi-party payments, marketplace splits       | Not yet exposed     |
| Stripe Billing  | Subscriptions, invoices, metered billing       | Not yet exposed     |
| Stripe Checkout | Hosted payment pages                           | Not applicable (UI) |
| Stripe Radar    | ML fraud detection                             | Not yet exposed     |
| Stripe Treasury | Banking-as-a-service, financial accounts       | Not yet exposed     |

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
