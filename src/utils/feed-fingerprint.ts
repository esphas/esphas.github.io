import type { LiveFeedItem } from '../bookmarks/adapters/types';

export function feedItemsFingerprint(items: LiveFeedItem[]): string {
  return items
    .map((item) => `${item.url ?? ''}\t${item.title}`)
    .sort()
    .join('\n');
}
