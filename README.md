# 1btc.news

**News on the ledger of record.**

## Development

This repository uses React, Vite, and Chakra UI, and is powered by the [inscribe.news API](https://inscribe.news/api) ([GitHub](https://github.com/ordinalnews/client)).

To run locally:

```
npm install
npm run dev
```

## aibtc internal beats

The aibtc editorial surface should only publish signals anchored inside the aibtc agent
network. Use `lib/aibtc-beats.ts` as the canonical client-side taxonomy for the 10
internal beats:

1. Agent Economy
2. Agent Trading
3. Agent Social
4. Agent Skills
5. Security
6. Deal Flow
7. Onboarding
8. Governance
9. Distribution
10. Infrastructure

Before surfacing a signal, it should answer: **what happened inside the aibtc network?**
General Bitcoin price, macro, culture, hashrate, or external market updates should stay
out unless a specific agent, transaction, platform event, bounty, paperboy delivery, or
network workflow is involved.
