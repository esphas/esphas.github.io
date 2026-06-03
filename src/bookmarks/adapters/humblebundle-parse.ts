import type { LiveFeedItem } from './types';

const BASE_URL = 'https://www.humblebundle.com';

function parseJsonString(raw: string): string {
  return JSON.parse(`"${raw}"`) as string;
}

export type HumbleBundleCategory = 'books' | 'games' | 'software';

export function humbleBundleCategoryFromUrl(
  url?: string,
): HumbleBundleCategory | null {
  if (!url) return null;
  if (url.includes('/books/')) return 'books';
  if (url.includes('/games/')) return 'games';
  if (url.includes('/software/')) return 'software';
  return null;
}

function categoryFromUrl(path: string): string {
  if (path.startsWith('/games/')) return 'Games';
  if (path.startsWith('/books/')) return 'Books';
  if (path.startsWith('/software/')) return 'Software';
  return 'Bundle';
}

function pickFirst(source: string, key: string): string | undefined {
  const hit = source.match(
    new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`),
  );
  return hit ? parseJsonString(hit[1]) : undefined;
}

function pickEndDateTime(source: string): string | undefined {
  const hit = source.match(/"end_date\|datetime"\s*:\s*"([^"]+)"/);
  return hit?.[1];
}

export type ParseHumbleBundleOptions = {
  maxItems?: number;
};

export function parseHumbleBundleHtml(
  html: string,
  options: ParseHumbleBundleOptions = {},
): LiveFeedItem[] {
  const maxItems = options.maxItems ?? 8;
  const allItems: LiveFeedItem[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/"product_url"\s*:\s*"(\/[^"]+)"/g)) {
    const path = match[1];
    const idx = match.index ?? 0;
    const after = html.slice(idx, idx + 8000);

    const title =
      pickFirst(after, 'tile_name') ?? pickFirst(after, 'tile_short_name');
    const author = pickFirst(after, 'author');
    const highlights = after.match(/"hover_highlights"\s*:\s*(\[[^\]]*\])/);
    const highlightList = highlights
      ? (JSON.parse(highlights[1]) as string[])
      : [];

    const endDateTime = pickEndDateTime(after);

    const url = `${BASE_URL}${path}`;
    if (seen.has(url)) continue;
    seen.add(url);

    const metaParts = [categoryFromUrl(path)];
    if (author) metaParts.push(author);
    if (highlightList.length) metaParts.push(highlightList.join(' · '));

    allItems.push({
      title: title ?? path,
      shop: metaParts.join(' · '),
      url,
      ...(endDateTime ? { expiresAt: endDateTime } : {}),
    });
  }

  return pickBalancedItems(allItems, maxItems);
}

const CATEGORY_ORDER: HumbleBundleCategory[] = ['books', 'games', 'software'];

function pickBalancedItems(
  items: LiveFeedItem[],
  maxItems: number,
): LiveFeedItem[] {
  if (items.length <= maxItems) return items;

  const buckets: Record<HumbleBundleCategory, LiveFeedItem[]> = {
    books: [],
    games: [],
    software: [],
  };
  const uncategorized: LiveFeedItem[] = [];

  for (const item of items) {
    const category = humbleBundleCategoryFromUrl(item.url);
    if (category) buckets[category].push(item);
    else uncategorized.push(item);
  }

  const picked: LiveFeedItem[] = [];
  const indices = Object.fromEntries(
    CATEGORY_ORDER.map((key) => [key, 0]),
  ) as Record<HumbleBundleCategory, number>;

  while (picked.length < maxItems) {
    let added = false;
    for (const category of CATEGORY_ORDER) {
      const bucket = buckets[category];
      const index = indices[category];
      if (index < bucket.length) {
        picked.push(bucket[index]);
        indices[category] = index + 1;
        added = true;
        if (picked.length >= maxItems) break;
      }
    }
    if (!added) break;
  }

  if (picked.length < maxItems) {
    const pickedUrls = new Set(picked.map((item) => item.url));
    for (const item of [...uncategorized, ...items]) {
      if (picked.length >= maxItems) break;
      if (item.url && pickedUrls.has(item.url)) continue;
      picked.push(item);
      if (item.url) pickedUrls.add(item.url);
    }
  }

  return picked;
}
