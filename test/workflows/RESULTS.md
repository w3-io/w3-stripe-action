# E2E Test Results

> Last verified: 2026-04-16 (41/44 commands PASS, 3 KYB-blocked + 1 test-mode quirk)

## Prerequisites

The env var names below are what this repo's own E2E workflow reads.
In your own workflows, name secrets however you like — the fixed
contract is the action-input names (`api-key`, `customer-id`, etc.).

| Credential             | Env var                       | Source                                                              |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------- |
| Stripe API key (test)  | `STRIPE_API_KEY`              | https://dashboard.stripe.com/test/apikeys (starts `sk_test_`)       |
| Test Connect account   | `STRIPE_CONNECT_ACCOUNT_ID`   | https://dashboard.stripe.com/test/connect/accounts → create account |

### One-time Dashboard setup

1. **Enable Card as a payment method** — https://dashboard.stripe.com/test/settings/payment_methods → Card → Activate. Stripe ignores the deprecated `payment_method_types[card]` input now, so the action uses `automatic_payment_methods[enabled]=true, allow_redirects=never` by default. Card must still be on.

2. **Add a test bank account for payouts** — https://dashboard.stripe.com/test/settings/payouts → Add bank. Use routing `110000000`, account `000123456789`. Without this, `create-payout` fails with "no external accounts in that currency."

3. **Create a test Connect account** — https://dashboard.stripe.com/test/connect/accounts → Create. Click through fake data. Stripe issues `acct_...`. This is the `destination` for `create-transfer`.

The E2E workflow seeds available balance via `tok_bypassPending` before exercising payouts and transfers, so no manual funding is needed.

## Results

| #   | Step                          | Command                     | Status | Notes                          |
| --- | ----------------------------- | --------------------------- | ------ | ------------------------------ |
| 1   | Create a test customer        | `create-customer`           | PASS   |                                |
| 2   | List customers                | `list-customers`            | PASS   |                                |
| 3   | Get the created customer      | `get-customer`              | PASS   |                                |
| 4   | Update customer metadata      | `update-customer`           | PASS   |                                |
| 5   | Create a product              | `create-product`            | PASS   |                                |
| 6   | List products                 | `list-products`             | PASS   |                                |
| 7   | Get the created product       | `get-product`               | PASS   |                                |
| 8   | Create a one-time price       | `create-price`              | PASS   |                                |
| 9   | Create a recurring price      | `create-price`              | PASS   | interval: month                |
| 10  | List prices                   | `list-prices`               | PASS   |                                |
| 11  | Get the one-time price        | `get-price`                 | PASS   |                                |
| 12  | Create a payment (manual)     | `create-payment`            | PASS   | capture-method: manual         |
| 13  | Confirm with pm_card_visa     | `confirm-payment`           | PASS   |                                |
| 14  | Capture the confirmed payment | `capture-payment`           | PASS   |                                |
| 15  | Create a refund               | `create-refund`             | PASS   | partial (2500 of 5000)         |
| 16  | Get the refund                | `get-refund`                | PASS   |                                |
| 17  | List refunds                  | `list-refunds`              | PASS   |                                |
| 18  | Create a payment (auto)       | `create-payment`            | PASS   |                                |
| 19  | Get the payment               | `get-payment`               | PASS   |                                |
| 20  | List payments                 | `list-payments`             | PASS   |                                |
| 21  | Cancel the payment            | `cancel-payment`            | PASS   |                                |
| 22  | Create an invoice             | `create-invoice`            | PASS   |                                |
| 23  | Get the invoice               | `get-invoice`               | PASS   |                                |
| 24  | Pay the invoice               | `pay-invoice`               | PASS   |                                |
| 25  | List invoices                 | `list-invoices`             | PASS   |                                |
| 26  | Attach test PM to customer    | (run step, curl)            | PASS   | captures new PM ID from attach |
| 27  | Create a subscription         | `create-subscription`       | PASS   | uses attached PM as default    |
| 28  | List subscriptions            | `list-subscriptions`        | PASS   |                                |
| 29  | Get the subscription          | `get-subscription`          | PASS   |                                |
| 30  | Cancel the subscription       | `cancel-subscription`       | PASS   |                                |
| 31  | Get account balance           | `get-balance`               | PASS   |                                |
| 32  | List balance transactions     | `list-balance-transactions` | PASS   |                                |
| 33  | Seed available balance        | (run step, curl)            | PASS   | tok_bypassPending → $50.00     |
| 34  | Create a payout               | `create-payout`             | PASS   | 500 cents from seeded balance  |
| 35  | Get the payout                | `get-payout`                | PASS   |                                |
| 36  | List payouts                  | `list-payouts`              | PASS   |                                |
| 37  | Create a transfer             | `create-transfer`           | PASS   | → Connect account              |
| 38  | Get the transfer              | `get-transfer`              | PASS   |                                |
| 39  | List transfers                | `list-transfers`            | PASS   |                                |
| 40  | Dispute payment               | `create-payment`            | PASS   | uses pm_card_createDispute     |
| 41  | Confirm dispute payment       | `confirm-payment`           | PASS   |                                |
| 42  | List disputes                 | `list-disputes`             | PASS   |                                |
| 43  | Get the dispute               | `get-dispute`               | PASS   | real dispute, not synthetic    |
| 44  | List events                   | `list-events`               | PASS   |                                |
| 45  | Get an event                  | `get-event`                 | PASS   |                                |
| 46  | Delete the test customer      | `delete-customer`           | PASS   | cleanup                        |

**Summary: 41 of 44 commands pass end-to-end against Stripe test mode. Round-trip wall time: ~74s.**

## Skipped Commands

| Command                 | Reason                                                          |
| ----------------------- | --------------------------------------------------------------- |
| `cancel-payout`         | Stripe test-mode payouts transition past `pending` faster than  |
|                         | the step can run; the API rejects cancel for anything past      |
|                         | pending. TODO: add an async retry pattern.                      |
| `create-onramp-session` | Stripe Crypto Onramp requires full KYB (Know Your Business).    |
| `get-onramp-session`    | Same — Onramp is production-only even in test mode without KYB. |
| `get-onramp-quotes`     | Same.                                                           |

## How to run

```bash
export STRIPE_API_KEY="sk_test_..."

w3 workflow test --execute test/workflows/e2e.yaml
```

The workflow is self-contained — it seeds its own payment method
(via `pm_card_visa` attach) and its own available balance (via
`tok_bypassPending`), so repeated runs don't need external state
aside from the Dashboard prereqs above.
