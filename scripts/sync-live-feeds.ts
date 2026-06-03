import 'dotenv/config';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { LIVE_FEED_ADAPTER_IDS } from '../src/bookmarks/adapters/registry';
import { scrapeLiveFeed } from '../src/bookmarks/adapters/scrape-registry';
import type { LiveFeed } from '../src/bookmarks/adapters/types';

type LiveBookmark = {
  type: 'live';
  adapter: string;
  config: Record<string, unknown>;
};

const BOOKMARKS_DIR = path.join(process.cwd(), 'src/data/bookmarks');
const FEEDS_OUT_DIR = path.join(process.cwd(), 'feeds');
const PUBLIC_FEEDS_DIR = path.join(process.cwd(), 'public', 'feeds');

function mirrorFeedToPublic(feedKey: string): void {
  const jsonSrc = feedOutputPath(feedKey);
  const jsonDest = path.join(PUBLIC_FEEDS_DIR, `${feedKey}.json`);
  mkdirSync(path.dirname(jsonDest), { recursive: true });
  cpSync(jsonSrc, jsonDest);

  const imagesSrc = path.join(FEEDS_OUT_DIR, feedKey, 'images');
  if (!existsSync(imagesSrc)) return;

  const imagesDest = path.join(PUBLIC_FEEDS_DIR, feedKey, 'images');
  cpSync(imagesSrc, imagesDest, { recursive: true });
}

function readLiveBookmarks(): LiveBookmark[] {
  const files = readdirSync(BOOKMARKS_DIR).filter((name) =>
    name.endsWith('.json'),
  );
  const bookmarks: LiveBookmark[] = [];

  for (const file of files) {
    const raw = readFileSync(path.join(BOOKMARKS_DIR, file), 'utf8');
    const data = JSON.parse(raw) as { type?: string };
    if (data.type !== 'live') continue;
    bookmarks.push(data as LiveBookmark);
  }

  return bookmarks;
}

function feedOutputPath(feedKey: string): string {
  return path.join(FEEDS_OUT_DIR, `${feedKey}.json`);
}

function readExistingFeed(feedKey: string): LiveFeed | null {
  const filePath = feedOutputPath(feedKey);
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as LiveFeed;
  } catch {
    return null;
  }
}

async function syncFeed(
  adapterId: string,
  config: Record<string, unknown>,
): Promise<'updated' | 'kept' | 'skipped'> {
  if (
    !LIVE_FEED_ADAPTER_IDS.includes(
      adapterId as (typeof LIVE_FEED_ADAPTER_IDS)[number],
    )
  ) {
    return 'skipped';
  }

  const feedKey =
    typeof config.feedKey === 'string' ? config.feedKey : undefined;
  if (!feedKey) {
    console.warn(`[sync] missing feedKey for adapter ${adapterId}`);
    return 'skipped';
  }

  const scraped = await scrapeLiveFeed(adapterId, config);
  const feed = scraped ?? readExistingFeed(feedKey);

  if (!feed) {
    console.warn(`[sync] no feed for ${feedKey}`);
    return 'skipped';
  }

  const outPath = feedOutputPath(feedKey);
  mkdirSync(path.dirname(outPath), { recursive: true });

  const next = JSON.stringify(feed, null, 2) + '\n';
  const prevRaw = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
  const prevFeed = prevRaw ? (JSON.parse(prevRaw) as LiveFeed) : null;

  if (prevFeed && JSON.stringify(prevFeed) === JSON.stringify(feed)) {
    console.log(`[sync] unchanged ${feedKey}`);
    return 'kept';
  }

  writeFileSync(outPath, next);
  mirrorFeedToPublic(feedKey);

  if (scraped) {
    console.log(`[sync] updated ${feedKey}`);
    return 'updated';
  }

  if (prevFeed) {
    console.log(`[sync] kept existing ${feedKey}`);
  } else {
    console.log(`[sync] seeded ${feedKey}`);
  }
  return 'kept';
}

async function main() {
  const bookmarks = readLiveBookmarks();
  if (bookmarks.length === 0) {
    console.log('[sync] no live bookmarks');
    return;
  }

  let updated = 0;
  for (const bookmark of bookmarks) {
    const result = await syncFeed(bookmark.adapter, bookmark.config);
    if (result === 'updated') updated += 1;
  }

  console.log(`[sync] done (${updated} updated)`);
}

main().catch((error) => {
  console.error('[sync] failed', error);
  process.exitCode = 1;
});
