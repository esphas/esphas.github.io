import type { CollectionEntry } from 'astro:content';
import { getLiveAdapterMeta } from '../bookmarks/adapters/registry';
import { isFeedAdapter } from '../bookmarks/adapters/types';

export type BookmarkEntry = CollectionEntry<'bookmarks'>;
export type BookmarkData = BookmarkEntry['data'];

export function getSortedBookmarks(
  bookmarks: BookmarkEntry[],
): BookmarkEntry[] {
  return [...bookmarks].sort((a, b) =>
    a.data.order.localeCompare(b.data.order),
  );
}

export function getBookmarkTitle(data: BookmarkData): string {
  return data.title;
}

export function getBookmarkDescription(data: BookmarkData): string | null {
  return data.description;
}

export function getBookmarkHref(data: BookmarkData): string {
  if (data.type === 'url') return data.url;
  if (data.type === 'live') {
    const meta = getLiveAdapterMeta(data.adapter);
    if (meta) return meta.getLandingUrl(data.config);
    throw new Error(`Unknown live adapter: ${data.adapter}`);
  }
  throw new Error('Unsupported bookmark type');
}

export function getLiveFeedKey(data: BookmarkData): string | null {
  if (data.type !== 'live') return null;
  const meta = getLiveAdapterMeta(data.adapter);
  if (!meta || !isFeedAdapter(meta)) return null;
  return meta.getFeedKey(data.config);
}
