# W3 Stripe Action

Payments, payouts, customers, refunds, and balance via Stripe API.

## About Stripe

[Stripe](https://stripe.com) is a payments infrastructure platform
processing hundreds of billions of dollars annually for millions of
businesses. PCI DSS Level 1 certified. Use this action to create
payment intents, manage customers, issue refunds, and check balances
from automated workflows.

## Usage

```yaml
- name: Create payment
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-payment
    api-key: ${{ secrets.STRIPE_API_KEY }}
    amount: '1000'
    currency: 'usd'
```

## Commands

| Command           | Description                   | Category  |
| ----------------- | ----------------------------- | --------- |
| `create-payment`  | Create a payment intent       | Payments  |
| `get-payment`     | Retrieve payment status       | Payments  |
| `confirm-payment` | Confirm a payment server-side | Payments  |
| `cancel-payment`  | Cancel a payment intent       | Payments  |
| `create-customer` | Create a customer             | Customers |
| `get-customer`    | Retrieve a customer           | Customers |
| `list-customers`  | List customers                | Customers |
| `get-balance`     | Check account balance         | Balance   |
| `create-refund`   | Refund a payment              | Refunds   |
| `get-refund`      | Retrieve a refund             | Refunds   |
| `create-payout`   | Send funds to bank            | Payouts   |
| `get-payout`      | Retrieve a payout             | Payouts   |

## Documentation

See [docs/guide.md](docs/guide.md) for full reference.

## Development

```bash
npm install
npm test          # tests
npm run lint      # eslint
npm run all       # format + lint + test + bundle
```
