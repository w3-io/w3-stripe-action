# W3 Stripe Action

Complete Stripe integration — payments, customers, subscriptions, invoices, products, prices, refunds, payouts, balance, transfers, and crypto onramp.

## Quick Start

```yaml
- name: Create subscription
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-subscription
    api-key: ${{ secrets.STRIPE_API_KEY }}
    customer-id: "cus_abc123"
    price-id: "price_xyz"
```

## Commands

| Category | Commands |
|----------|----------|
| **Payments** | `create-payment`, `get-payment`, `confirm-payment`, `capture-payment`, `cancel-payment`, `list-payments` |
| **Customers** | `create-customer`, `get-customer`, `update-customer`, `delete-customer`, `list-customers` |
| **Balance** | `get-balance`, `list-balance-transactions` |
| **Products** | `create-product`, `get-product`, `list-products` |
| **Prices** | `create-price`, `get-price`, `list-prices` |
| **Subscriptions** | `create-subscription`, `get-subscription`, `cancel-subscription`, `list-subscriptions` |
| **Invoices** | `create-invoice`, `get-invoice`, `pay-invoice`, `list-invoices` |
| **Refunds** | `create-refund`, `get-refund`, `list-refunds` |
| **Payouts** | `create-payout`, `get-payout`, `cancel-payout`, `list-payouts` |
| **Transfers** | `create-transfer`, `get-transfer`, `list-transfers` |
| **Disputes** | `get-dispute`, `list-disputes` |
| **Events** | `get-event`, `list-events` |
| **Crypto Onramp** | `create-onramp-session`, `get-onramp-session`, `list-onramp-sessions` |

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `command` | Yes | — | Operation to perform (see Commands) |
| `api-key` | Yes | — | Stripe API key (`sk_test_...` or `sk_live_...`) |
| `api-url` | No | — | Stripe API base URL override |
| `amount` | No | — | Amount in smallest currency unit (e.g. cents) |
| `currency` | No | `usd` | Three-letter ISO currency code |
| `payment-id` | No | — | Payment intent ID (`pi_...`) |
| `payment-method` | No | — | Payment method ID (`pm_...`) |
| `description` | No | — | Description for payment, customer, product, invoice, or payout |
| `metadata` | No | — | JSON object of key-value metadata |
| `customer-id` | No | — | Customer ID (`cus_...`) |
| `email` | No | — | Customer email address |
| `name` | No | — | Customer or product name |
| `product-id` | No | — | Product ID (`prod_...`) |
| `price-id` | No | — | Price ID (`price_...`) |
| `unit-amount` | No | — | Price per unit in cents |
| `recurring-interval` | No | — | Recurring interval: `day`, `week`, `month`, or `year` |
| `subscription-id` | No | — | Subscription ID (`sub_...`) |
| `status` | No | — | Filter by status (e.g. `active`, `canceled`, `past_due`) |
| `invoice-id` | No | — | Invoice ID (`in_...`) |
| `refund-id` | No | — | Refund ID (`re_...`) |
| `reason` | No | — | Refund reason: `duplicate`, `fraudulent`, or `requested_by_customer` |
| `payout-id` | No | — | Payout ID (`po_...`) |
| `transfer-id` | No | — | Transfer ID (`tr_...`) |
| `destination` | No | — | Connected account ID for transfers (`acct_...`) |
| `dispute-id` | No | — | Dispute ID (`dp_...`) |
| `event-id` | No | — | Event ID (`evt_...`) |
| `event-type` | No | — | Event type filter (e.g. `payment_intent.succeeded`) |
| `type` | No | — | Balance transaction type filter (`charge`, `refund`, `payout`, etc.) |
| `limit` | No | `10` | Maximum results to return |
| `session-id` | No | — | Onramp session ID (`cos_...`) |
| `wallet-addresses` | No | — | JSON object mapping network to wallet address |
| `lock-wallet-address` | No | — | Prevent customer from changing wallet address |
| `source-currency` | No | — | Fiat currency for onramp (`usd` or `eur`) |
| `source-amount` | No | — | Fiat amount for onramp |
| `destination-currency` | No | — | Target cryptocurrency |
| `destination-network` | No | — | Target blockchain |
| `destination-amount` | No | — | Crypto amount to purchase |
| `destination-currencies` | No | — | Comma-separated list of allowed cryptocurrencies |
| `destination-networks` | No | — | Comma-separated list of allowed networks |
| `customer-email` | No | — | Customer email for onramp KYC pre-fill |
| `customer-ip-address` | No | — | Customer IP for geographic validation |
| `max-retries` | No | `3` | Maximum retry attempts on 429/5xx |
| `timeout` | No | `30` | Request timeout in seconds |

## Outputs

| Output | Description |
|--------|-------------|
| `result` | JSON result of the operation |

## Authentication

Get an API key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) and store it as `STRIPE_API_KEY` in your repository secrets. Use `sk_test_...` keys for testing and `sk_live_...` keys for production.
