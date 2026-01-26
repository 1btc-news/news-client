import { VERIFIED_AUTHORS, WORDS_PER_MINUTE } from './constants';

export function isVerifiedAuthor(author: string | undefined): boolean {
  return author ? VERIFIED_AUTHORS.includes(author) : false;
}

export function getReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / WORDS_PER_MINUTE);
}

export function formatDate(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getMetaDescription(body: string | undefined, fallback: string): string {
  if (!body) return fallback;
  return body.slice(0, 160).replace(/\n/g, ' ').trim();
}
