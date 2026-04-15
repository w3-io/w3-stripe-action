# E2E Test Results

Last verified: 2026-04-15

## Environment

- W3 local network (3-node localnet)
- Protocol: master (includes EIP-712, bridge-allow expansion, nonce manager)
- Runner image: w3io/w3-runner (Node 20/24)

## Prerequisites

- W3 local network running (make dev)
- W3_SECRET_STRIPE_API_KEY set to a Stripe test-mode key (sk_test_*)

## Results

| Step | Command | Status | Notes |
|------|---------|--------|-------|
| 1 | create-customer | PASS | e2e-test@example.com |
| 2 | list-customers | PASS | limit 5 |
| 3 | get-customer | PASS | By created customer ID |
| 4 | update-customer | PASS | Set metadata |
| 5 | create-product | PASS | E2E Test Product |
| 6 | list-products | PASS | limit 5 |
| 7 | get-product | PASS | By created product ID |
| 8 | create-price (one-time) | PASS | $25.00 USD |
| 9 | create-price (recurring) | PASS | $9.99/month USD |
| 10 | list-prices | PASS | limit 5 |
| 11 | get-price | PASS | By one-time price ID |
| 12 | create-payment | PASS | $50.00 USD payment intent |
| 13 | get-payment | PASS | By payment intent ID |
| 14 | list-payments | PASS | limit 5 |
| 15 | cancel-payment | PASS | Cancel payment intent |
| 16 | create-invoice | PASS | For test customer |
| 17 | list-invoices | PASS | limit 5 |
| 18 | get-invoice | PASS | By invoice ID |
| 19 | get-balance | PASS | Account balance |
| 20 | list-balance-transactions | PASS | limit 5 |
| 21 | list-refunds | PASS | limit 5 |
| 22 | list-payouts | PASS | limit 5 |
| 23 | list-transfers | PASS | limit 5 |
| 24 | list-disputes | PASS | limit 5 |
| 25 | list-events | PASS | limit 5 |
| 26 | delete-customer | PASS | Cleanup |

## Known Limitations

- Subscription steps (create-subscription, list-subscriptions,
  get-subscription, cancel-subscription) are commented out because they
  require a test payment method attached to the customer.
- create-refund requires a successful charge; skipped in basic e2e.
