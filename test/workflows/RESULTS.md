# E2E Test Results

> Last verified: 2026-04-15 -- NOT YET VERIFIED (YAML error in e2e.yaml)

## Prerequisites

| Credential | Env var | Source |
|-----------|---------|--------|
| Stripe API key (test mode) | `STRIPE_API_KEY` | Stripe dashboard (sk_test_*) |

## Results

| # | Step | Command | Status | Notes |
|---|------|---------|--------|-------|
| 1 | Create a test customer | `create-customer` | NOT YET VERIFIED | YAML parse error |
| 2 | List customers | `list-customers` | NOT YET VERIFIED | |
| 3 | Get the created customer | `get-customer` | NOT YET VERIFIED | |
| 4 | Update customer metadata | `update-customer` | NOT YET VERIFIED | |
| 5 | Create a product | `create-product` | NOT YET VERIFIED | |
| 6 | List products | `list-products` | NOT YET VERIFIED | |
| 7 | Get the created product | `get-product` | NOT YET VERIFIED | |
| 8 | Create a one-time price | `create-price` | NOT YET VERIFIED | |
| 9 | Create a recurring price | `create-price` (recurring) | NOT YET VERIFIED | |
| 10 | List prices | `list-prices` | NOT YET VERIFIED | |
| 11 | Get the one-time price | `get-price` | NOT YET VERIFIED | |
| 12 | Create a payment intent (manual) | `create-payment` | NOT YET VERIFIED | |
| 13 | List refunds | `list-refunds` | NOT YET VERIFIED | |
| 14 | Create a payment intent | `create-payment` | NOT YET VERIFIED | |
| 15 | Get the payment intent | `get-payment` | NOT YET VERIFIED | |
| 16 | List payment intents | `list-payments` | NOT YET VERIFIED | |
| 17 | Cancel the payment intent | `cancel-payment` | NOT YET VERIFIED | |
| 18 | Create an invoice | `create-invoice` | NOT YET VERIFIED | |
| 19 | Get the invoice | `get-invoice` | NOT YET VERIFIED | |
| 20 | Pay the invoice | `pay-invoice` | NOT YET VERIFIED | |
| 21 | List invoices | `list-invoices` | NOT YET VERIFIED | |
| 22 | Create a subscription | `create-subscription` | NOT YET VERIFIED | |
| 23 | List subscriptions | `list-subscriptions` | NOT YET VERIFIED | |
| 24 | Get the subscription | `get-subscription` | NOT YET VERIFIED | |
| 25 | Cancel the subscription | `cancel-subscription` | NOT YET VERIFIED | |
| 26 | Get account balance | `get-balance` | NOT YET VERIFIED | |
| 27 | List balance transactions | `list-balance-transactions` | NOT YET VERIFIED | |
| 28 | List payouts | `list-payouts` | NOT YET VERIFIED | |
| 29 | List transfers | `list-transfers` | NOT YET VERIFIED | |
| 30 | List disputes | `list-disputes` | NOT YET VERIFIED | |
| 31 | List events | `list-events` | NOT YET VERIFIED | |
| 32 | Get an event | `get-event` | NOT YET VERIFIED | |
| 33 | Delete the test customer | `delete-customer` | NOT YET VERIFIED | |

## Skipped Commands

| Command | Reason |
|---------|--------|
| `confirm-payment` | Requires payment methods enabled in Dashboard |
| `capture-payment` | Requires confirmed payment |
| `create-refund` / `get-refund` | Requires captured payment |
| `create-payout` / `get-payout` / `cancel-payout` | Requires connected account with balance |
| `create-transfer` / `get-transfer` | Requires Stripe Connect account |
| `get-dispute` | Requires real disputed payment |
| `create-onramp-session` / `get-onramp-session` / `get-onramp-quotes` | Requires Stripe Onramp beta |

## How to run

```bash
# Export credentials
export STRIPE_API_KEY="sk_test_..."

# Run
w3 workflow test --execute test/workflows/e2e.yaml
```
