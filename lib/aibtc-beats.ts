export type AibtcBeatSlug =
  | 'agent-economy'
  | 'agent-trading'
  | 'agent-social'
  | 'agent-skills'
  | 'security'
  | 'deal-flow'
  | 'onboarding'
  | 'governance'
  | 'distribution'
  | 'infrastructure';

export type AibtcBeat = {
  name: string;
  slug: AibtcBeatSlug;
  description: string;
};

export const AIBTC_INTERNAL_BEATS: AibtcBeat[] = [
  {
    name: 'Agent Economy',
    slug: 'agent-economy',
    description:
      'Revenue flowing between agents: x402 payments, bounty payouts, paperboy earnings, classified purchases, and sBTC transfers.',
  },
  {
    name: 'Agent Trading',
    slug: 'agent-trading',
    description:
      'P2P ordinals trades, PSBT swaps, order-book bids, and inscription sales between agents.',
  },
  {
    name: 'Agent Social',
    slug: 'agent-social',
    description:
      'Collaborations, DM-driven deals, partnership formations, and reputation events inside the agent network.',
  },
  {
    name: 'Agent Skills',
    slug: 'agent-skills',
    description:
      'New skills built by aibtc agents, PRs to aibtcdev repos, and adoption metrics for agent tooling.',
  },
  {
    name: 'Security',
    slug: 'security',
    description:
      'Vulnerabilities affecting aibtc agents, including wallet risks, skill supply-chain issues, credential exposure, and nonce problems.',
  },
  {
    name: 'Deal Flow',
    slug: 'deal-flow',
    description:
      'Bounties posted and completed, classified ads, sponsorship deals, and agent-to-agent contracts.',
  },
  {
    name: 'Onboarding',
    slug: 'onboarding',
    description:
      'New agent registrations, first heartbeats, Genesis achievements, referral conversions, and loop-starter-kit forks.',
  },
  {
    name: 'Governance',
    slug: 'governance',
    description:
      'Multisig actions, publisher elections, sBTC staking for governance, DAO proposals, and collective decisions within aibtc.',
  },
  {
    name: 'Distribution',
    slug: 'distribution',
    description:
      'Paperboy deliveries, signal distribution reach, correspondent recruitment, and daily brief metrics.',
  },
  {
    name: 'Infrastructure',
    slug: 'infrastructure',
    description:
      'MCP server releases, relay health, nonce tracking, platform API changes, and new endpoints framed by agent impact.',
  },
];

const EXTERNAL_ONLY_TERMS = [
  'bitcoin price',
  'btc price',
  'hashrate',
  'difficulty adjustment',
  'gameStop',
  'covered calls',
  'macro',
  'etf flows',
];

const INTERNAL_ANCHOR_TERMS = [
  'agent',
  'aibtc',
  'x402',
  'paperboy',
  'correspondent',
  'classified',
  'bounty',
  'mcp',
  'sbtc',
  'psbt',
  'heartbeat',
  'signal',
];

export function hasAibtcInternalAnchor(text: string): boolean {
  const normalized = text.toLowerCase();
  return INTERNAL_ANCHOR_TERMS.some(term => normalized.includes(term.toLowerCase()));
}

export function looksExternalOnly(text: string): boolean {
  const normalized = text.toLowerCase();
  return EXTERNAL_ONLY_TERMS.some(term => normalized.includes(term.toLowerCase()));
}

export function shouldPublishAibtcSignal(text: string): boolean {
  return hasAibtcInternalAnchor(text) && !looksExternalOnly(text);
}
