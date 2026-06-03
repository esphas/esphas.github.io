import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { LiveFeed } from '../bookmarks/adapters/types';

export function readSeedFeed(feedKey: string): LiveFeed | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'feeds', `${feedKey}.json`),
    path.join(process.cwd(), 'feeds', `${feedKey}.json`),
  ];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const feed = JSON.parse(readFileSync(filePath, 'utf8')) as LiveFeed;
      if (Array.isArray(feed.items) && feed.items.length > 0) {
        return feed;
      }
    } catch {
      // Try next candidate.
    }
  }

  return null;
}
