import { attachHumbleBundleSummaries } from '../../../scripts/lib/feed-summaries';
import { readSeedFeed } from '../../utils/feed-seed';
import { parseHumbleBundleHtml } from './humblebundle-parse';
import type { LiveFeed } from './types';
import {
  parseHumbleBundleConfig,
  type HumbleBundleConfig,
} from './humblebundle';

const USER_AGENT = 'Momokoi-FeedSync/1.0 (+https://icefla.me)';

async function fetchBundlesPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Parses embedded JSON from the bundles page HTML.
 * Inspired by the scrape approach in Ziggoto/Humble-Bundle-Api (Puppeteer + tile DOM).
 */
export async function scrapeHumbleBundleFeed(
  config: HumbleBundleConfig,
): Promise<LiveFeed | null> {
  const previous = readSeedFeed(config.feedKey);
  const html = await fetchBundlesPage(config.landingUrl);

  if (html) {
    const items = parseHumbleBundleHtml(html, { maxItems: config.maxItems });
    if (items.length > 0) {
      const feed: LiveFeed = {
        updatedAt: new Date().toISOString().slice(0, 10),
        sourceUrl: config.landingUrl,
        items,
      };
      return attachHumbleBundleSummaries(feed, previous);
    }
  }

  if (!previous) return null;
  return attachHumbleBundleSummaries(previous, previous);
}

export const humblebundleScraper = {
  parseConfig: parseHumbleBundleConfig,
  scrape: scrapeHumbleBundleFeed,
};
