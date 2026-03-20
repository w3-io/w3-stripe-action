# W3 Stripe Action

Complete Stripe integration — payments, customers, subscriptions, invoices,
products, prices, refunds, payouts, balance, and transfers.

## About Stripe

[Stripe](https://stripe.com) is a payments infrastructure platform
processing hundreds of billions of dollars annually for millions of
businesses. PCI DSS Level 1 certified.

## Usage

```yaml
- name: Create subscription
  uses: w3-io/w3-stripe-action@v0
  with:
    command: create-subscription
    api-key: ${{ secrets.STRIPE_API_KEY }}
    customer-id: 'cus_abc123'
    price-id: 'price_xyz'
```

## Commands (37)

| Category          | Commands                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Payments**      | create-payment, get-payment, confirm-payment, capture-payment, cancel-payment, list-payments |
| **Customers**     | create-customer, get-customer, update-customer, delete-customer, list-customers              |
| **Balance**       | get-balance, list-balance-transactions                                                       |
| **Products**      | create-product, get-product, list-products                                                   |
| **Prices**        | create-price, get-price, list-prices                                                         |
| **Subscriptions** | create-subscription, get-subscription, cancel-subscription, list-subscriptions               |
| **Invoices**      | create-invoice, get-invoice, pay-invoice, list-invoices                                      |
| **Refunds**       | create-refund, get-refund, list-refunds                                                      |
| **Payouts**       | create-payout, get-payout, cancel-payout, list-payouts                                       |
| **Transfers**     | create-transfer, get-transfer, list-transfers                                                |

## Documentation

See [docs/guide.md](docs/guide.md) for full reference with output schemas.

## Development

```bash
npm install
npm test          # 79 tests
npm run lint      # eslint
npm run all       # format + lint + test + bundle
```
