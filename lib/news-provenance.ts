import { InscriptionMeta, OrdinalNews } from './api-types';

export type NewsProvenanceStatus = 'ok' | 'warning';

export type NewsTrustSignal = {
  label: string;
  status: NewsProvenanceStatus;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_NEWS_DAYS = 7;

function parseTimestamp(timestamp?: string | number): number | undefined {
  if (timestamp === undefined || timestamp === null) return undefined;
  if (typeof timestamp === 'number') return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function hasPrimarySourceLink(news: Pick<OrdinalNews, 'url'>): boolean {
  if (!news.url) return false;
  try {
    const parsed = new URL(news.url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getNewsAgeDays(
  item: Pick<InscriptionMeta, 'timestamp'>,
  now: Date = new Date()
): number | undefined {
  const timestamp = parseTimestamp(item.timestamp);
  if (!timestamp) return undefined;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / DAY_MS));
}

export function getNewsTrustSignals(
  item: Pick<InscriptionMeta, 'timestamp'> & Pick<OrdinalNews, 'url' | 'authorAddress' | 'signature'>,
  now: Date = new Date()
): NewsTrustSignal[] {
  const ageDays = getNewsAgeDays(item, now);
  const signals: NewsTrustSignal[] = [];

  signals.push(
    hasPrimarySourceLink(item)
      ? { label: 'source linked', status: 'ok' }
      : { label: 'missing source', status: 'warning' }
  );

  if (ageDays === undefined) {
    signals.push({ label: 'unknown age', status: 'warning' });
  } else if (ageDays > STALE_NEWS_DAYS) {
    signals.push({ label: `${ageDays}d old`, status: 'warning' });
  } else {
    signals.push({ label: ageDays === 0 ? 'fresh today' : `${ageDays}d old`, status: 'ok' });
  }

  signals.push(
    item.authorAddress && item.signature
      ? { label: 'signed author', status: 'ok' }
      : { label: 'unsigned author', status: 'warning' }
  );

  return signals;
}
