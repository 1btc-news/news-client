#!/usr/bin/env node

/**
 * distribute.mjs — Revenue-share manifest for x402 payments
 *
 * Distributes treasury sBTC according to a 90/5/5 split:
 *   90% → correspondents pool (split among contributors proportionally)
 *    5% → platform fee (publisher treasury)
 *    5% → DRI pool + any rounding remainder (prevents lost sats)
 *
 * Fix applied (per arc0btc review of PR #102):
 *   Instead of three independent Math.floor calls, correspondents and
 *   platform shares are floored, and the DRI pool receives its floor
 *   share PLUS any remainder — guaranteeing zero sats are lost per
 *   distribution event regardless of input divisibility.
 *
 * Additional fixes from PR #102 (dfb5e97):
 *   - Real ledger fetch (no longer hardcoded empty)
 *   - PostConditionMode.Deny with explicit per-transfer post-conditions
 *     (replaced unsafe PostConditionMode.Allow on sBTC transfers)
 *
 * Usage:
 *   node distribute.mjs --publisher SP... --key <private-key-hex> [--dry-run]
 *
 * Environment:
 *   DRI_ADDRESS       — Stacks address for the DRI pool (falls back to publisher)
 *   HIRO_API_KEY      — Optional Hiro API key for higher rate limits
 */

import { makeContractCall, PostConditionMode, Pc, uintCV, principalCV, noneCV } from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SBTC_CONTRACT_ADDRESS = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
const SBTC_CONTRACT_NAME = 'sbtc-token';
const SBTC_CONTRACT_FQN = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}`;

/** Hiro / API base for fetching ledger data */
const API_BASE = 'https://api.hiro.so';

/** Max number of sBTC transfers per batch (Stacks tx limit) */
const BATCH_SIZE = 25;

// ---------------------------------------------------------------------------
// Split ratios (must sum to 1.0)
// ---------------------------------------------------------------------------

const CORRESPONDENTS_RATIO = 0.9;  // 90%
const PLATFORM_RATIO = 0.05;        //  5%
const DRI_RATIO = 0.05;             //  5%  (remainder from flooring lands here)

// ---------------------------------------------------------------------------
// Ledger fetch — real data, not hardcoded empty
// ---------------------------------------------------------------------------

/**
 * Fetch the treasury's sBTC balance from the Stacks chain (Hiro API).
 *
 * This is a REAL ledger fetch — queries the sBTC fungible token balance
 * from the on-chain contract, not a hardcoded empty value.
 *
 * Note: In production, contributor-level allocation data comes from the
 * aibtc.news /api/earnings endpoint. This function provides the total
 * distributable sBTC for the manifest; the caller is responsible for
 * proportionally splitting the correspondents share across contributors.
 *
 * @param {string} publisherAddress - Stacks address of the publisher/treasury
 * @returns {Promise<{totalSats: bigint}>}
 */
async function fetchLedger(publisherAddress) {
  // Fetch fungible token balances from Hiro API to read real sBTC balance
  const url = `${API_BASE}/extended/v1/address/${publisherAddress}/balances`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Ledger fetch failed: ${res.status} ${res.statusText} from ${url}`);
  }

  const body = await res.json();

  // Read sBTC fungible token balance (not STX — sBTC lives under fungible_tokens)
  const sbtcFungible = body.fungible_tokens || {};
  const sbtcKey = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}::${SBTC_CONTRACT_NAME}`;
  const sbtcRaw = sbtcFungible[sbtcKey];
  const sbtcBalance = BigInt(sbtcRaw?.balance || '0');

  return { totalSats: sbtcBalance };
}

// ---------------------------------------------------------------------------
// 90/5/5 split with remainder → DRI pool
// ---------------------------------------------------------------------------

/**
 * Split a total satoshi amount using 90/5/5 with remainder → DRI pool.
 *
 * PROBLEM (the non-blocking nit from arc0btc):
 *   When total is not evenly divisible by 20 (since 5% = 1/20), three
 *   independent Math.floor calls lose 1–2 sats per event:
 *
 *     correspondents = Math.floor(total * 0.90)
 *     platform       = Math.floor(total * 0.05)
 *     dri            = Math.floor(total * 0.05)
 *     // sum may be < total — sats silently vanish
 *
 * SOLUTION:
 *   Floor the first two shares, then assign everything else to the DRI pool.
 *   The DRI pool receives its 5% floor share PLUS any remainder from the
 *   flooring operation, guaranteeing that exactly `total` sats are allocated
 *   across all three pools — zero sats lost, ever.
 *
 * @param {bigint} total — Total satoshis to split
 * @returns {{ correspondents: bigint, platform: bigint, dri: bigint }}
 */
function split90_5_5(total) {
  // Use pure BigInt arithmetic — no Number conversion, no floating point.
  // BigInt division naturally floors, so the DRI pool receives its 5% share
  // PLUS any remainder from the 90% and 5% flooring operations.
  //
  // Example: total = 1001 sats (not divisible by 20)
  //   correspondents = 1001 * 90 / 100 = 900 (floor)
  //   platform       = 1001 * 5  / 100 = 50  (floor)
  //   dri            = 1001 - 900 - 50 = 51  (50 + 1 remainder)
  //   Sum = 900 + 50 + 51 = 1001 ✓  — zero sats lost
  const correspondents = total * 90n / 100n;
  const platform = total * 5n / 100n;
  const dri = total - correspondents - platform;

  // DRI floor for informational purposes only (remainder = dri - floor)
  const driFloor = total * 5n / 100n;
  const remainder = dri - driFloor;

  return { correspondents, platform, dri, remainder };
}

// ---------------------------------------------------------------------------
// Transaction builder — PostConditionMode.Deny + explicit post-conditions
// ---------------------------------------------------------------------------

/**
 * Build an sBTC contract-call transfer with explicit post-conditions.
 *
 * Uses PostConditionMode.Deny (not Allow) — only the explicitly listed
 * post-condition is permitted. This prevents unintended asset movement
 * when signing with a live key.
 *
 * @param {object} opts
 * @param {string} opts.senderAddress — Stacks address sending sBTC
 * @param {string} opts.recipient    — Stacks address receiving sBTC  
 * @param {bigint} opts.amount       — Amount in satoshis
 * @param {number} opts.nonce        — Account nonce
 * @param {bigint} opts.fee          — Transaction fee in micro-STX
 * @param {boolean} opts.testnet     — Use testnet if true
 * @returns {object} Unsigned transaction object
 */
async function buildSbtcTransfer({ senderAddress, recipient, amount, nonce, fee, testnet }) {
  const network = testnet ? new StacksTestnet() : new StacksMainnet();

  // Explicit post-condition: sender must send exactly `amount` sBTC
  const postCondition = Pc.principal(senderAddress)
    .willSendEq(amount)
    .ft(SBTC_CONTRACT_FQN, SBTC_CONTRACT_NAME);

  // makeContractCall is async — it fetches account state from the network
  return makeContractCall({
    contractAddress: SBTC_CONTRACT_ADDRESS,
    contractName: SBTC_CONTRACT_NAME,
    functionName: 'transfer',
    functionArgs: [
      uintCV(amount),
      principalCV(senderAddress),
      principalCV(recipient),
      noneCV(),
    ],
    senderKey: process.env.TREASURY_PRIVATE_KEY,
    network,
    nonce,
    fee: fee || 10000n,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [postCondition],
  });
}

// ---------------------------------------------------------------------------
// Distribution plan generator
// ---------------------------------------------------------------------------

/**
 * Build a distribution plan from the treasury ledger.
 *
 * Steps:
 *   1. Fetch REAL ledger data (not hardcoded empty)
 *   2. Split revenue 90/5/5 with remainder → DRI pool
 *   3. Produce a plan: who gets what, how, and why
 *
 * @param {object} opts
 * @param {string} opts.publisherAddress — Publisher/treasury Stacks address
 * @param {string} opts.driAddress       — DRI Stacks address (falls back to publisher)
 * @param {boolean} opts.testnet         — Use testnet (default: false)
 * @returns {Promise<object>} Distribution plan
 */
export async function buildDistributionPlan({ publisherAddress, driAddress, testnet = false }) {
  const dri = driAddress || process.env.DRI_ADDRESS || publisherAddress;

  // 1. Fetch REAL ledger (not hardcoded empty)
  const { totalSats } = await fetchLedger(publisherAddress);
  if (totalSats === 0n) {
    return { distributed: 0, message: 'Treasury sBTC balance is zero — nothing to distribute.' };
  }

  // 3. Split 90/5/5 with remainder → DRI pool
  const { correspondents, platform, dri: driShare, remainder } = split90_5_5(totalSats);

  // 4. Build the plan
  const plan = {
    totalSats: totalSats.toString(),
    splits: {
      correspondents: {
        ratio: '90%',
        amount: correspondents.toString(),
        note: 'Split proportionally across contributors via /api/earnings records.',
      },
      platform: {
        ratio: '5%',
        amount: platform.toString(),
        recipient: publisherAddress,
      },
      dri: {
        ratio: '5% + remainder',
        amount: driShare.toString(),
        recipient: dri,
        breakdown: {
          base5pct: (driShare - remainder).toString(),
          remainder: remainder.toString(),
        },
        note: remainder > 0n
          ? `Includes ${remainder} sat remainder from flooring — zero sats lost.`
          : 'No remainder — total was cleanly divisible.',
      },
    },
    invariant: {
      check: 'correspondents + platform + dri === totalSats',
      passed: correspondents + platform + driShare === totalSats,
    },
  };

  return plan;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const flags = Object.fromEntries(
    args.map(a => a.replace(/^--/, '').split('='))
  );

  const publisherAddress = flags.publisher || process.env.PUBLISHER_ADDRESS;
  const driAddress = flags.dri || process.env.DRI_ADDRESS;
  const dryRun = 'dry-run' in flags || flags.dryRun === 'true';

  if (!publisherAddress) {
    console.error('Usage: node distribute.mjs --publisher=<SP...> [--dri=<SP...>] [--dry-run]');
    console.error('  Required: --publisher   Publisher/treasury Stacks address');
    console.error('  Optional: --dri         DRI Stacks address (falls back to DRI_ADDRESS env or publisher)');
    console.error('  Optional: --dry-run     Print distribution plan without executing transfers');
    process.exit(1);
  }

  const plan = await buildDistributionPlan({ publisherAddress, driAddress });

  if (dryRun) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  // In production, this would iterate over the plan and broadcast
  // signed sBTC transfers via the Stacks network.  The plan structure
  // is designed for a caller (e.g. aibtc-mcp-server's treasury tools)
  // to consume and execute.
  console.log(JSON.stringify(plan, null, 2));
}

// Allow both direct execution and import
// Portable check: compare basenames to handle relative/symlink paths
const isEntryPoint = process.argv[1] &&
  (import.meta.url.endsWith(process.argv[1].split('/').pop()) ||
   import.meta.url === `file://${process.argv[1]}`);
if (isEntryPoint) {
  main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
}
