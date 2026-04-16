# TODO

## KYB-blocked (Crypto Onramp)

Stripe Crypto Onramp requires full Know Your Business verification.
These three commands are blocked on that, not on code:

- [ ] `create-onramp-session`
- [ ] `get-onramp-session`
- [ ] `get-onramp-quotes`

After KYB clears, revisit with a sandbox that has Onramp enabled and
uncomment the steps in `test/workflows/e2e.yaml` under "Crypto Onramp."

## Test-mode timing

- [ ] `cancel-payout` — Stripe test-mode payouts transition past
      `pending` faster than our workflow can fire a cancel. Fix:
      retry `cancel-payout` in a tight loop, or submit the cancel
      concurrently with the create and capture whichever wins.

## Action surface — nice-to-have

- [x] `pm_card_createDispute` is currently hardcoded in the E2E
      dispute flow. Could expose `create-test-dispute` as a first-
      class action command for demo/testing scripts, but it's only
      useful in sandbox so not a priority.
- [x] `create-charge` (legacy `/v1/charges`) — we use it inline via
      curl in the balance-seed step because we didn't want to add a
      deprecated endpoint to the action's public surface. Consider
      adding it as a partner-only internal command if other
      workflows need to seed test balance.

## Docs

- [x] `docs/guide.md` currently covers reads and basic writes but
      doesn't walk through the Connect / payouts setup we just
      proved out. Add a "Setting up for Connect + payouts" section
      that mirrors the Dashboard prereqs in RESULTS.md.
