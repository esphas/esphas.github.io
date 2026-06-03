import type { LiveFeed } from './types';

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

type CacheEntry = { fetchedAt: number; feed: LiveFeed };

export function readFeedCache(
  cacheKey: string,
  ttlMs = DEFAULT_TTL_MS,
): LiveFeed | null {
  if (typeof sessionStorage === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.fetchedAt > ttlMs) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    return entry.feed;
  } catch {
    return null;
  }
}

export function writeFeedCache(cacheKey: string, feed: LiveFeed): void {
  if (typeof sessionStorage === 'undefined') return;

  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ fetchedAt: Date.now(), feed } satisfies CacheEntry),
    );
  } catch {
    // Quota exceeded or private mode.
  }
}

export function createFetchFeed(options: {
  cacheKey: (feedKey: string) => string;
  feedPath: (feedKey: string) => string;
  cacheTtlMs?: number;
}): (feedKey: string) => Promise<LiveFeed | null> {
  const ttlMs = options.cacheTtlMs ?? DEFAULT_TTL_MS;

  return async (feedKey) => {
    const cacheKey = options.cacheKey(feedKey);
    const cached = readFeedCache(cacheKey, ttlMs);
    if (cached) return cached;

    try {
      const res = await fetch(options.feedPath(feedKey));
      if (!res.ok) return null;

      const feed = (await res.json()) as LiveFeed;
      if (!Array.isArray(feed.items) || feed.items.length === 0) return null;

      writeFeedCache(cacheKey, feed);
      return feed;
    } catch {
      return null;
    }
  };
}

export function finishLoadingRow(row: HTMLElement): void {
  row.classList.remove('is-loading');
  row.removeAttribute('aria-busy');
}
