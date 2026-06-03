import { groupBundlesByCategory } from '../../src/bookmarks/adapters/humblebundle';
import type { HumbleBundleCategory } from '../../src/bookmarks/adapters/humblebundle-parse';
import type { LiveFeed } from '../../src/bookmarks/adapters/types';
import { feedItemsFingerprint } from '../../src/utils/feed-fingerprint';
import {
  fallbackCreativeMarketSummary,
  fallbackHumbleBundleCategorySummary,
  summarizeCreativeMarketItems,
  summarizeHumbleBundleCategory,
} from './llm-summarize';

const HB_CATEGORIES: HumbleBundleCategory[] = ['books', 'games', 'software'];

export async function attachCreativeMarketSummary(
  feed: LiveFeed,
  previous: LiveFeed | null,
): Promise<LiveFeed> {
  const contentFingerprint = feedItemsFingerprint(feed.items);

  if (previous?.contentFingerprint === contentFingerprint && previous.summary) {
    return {
      ...feed,
      summary: previous.summary,
      contentFingerprint,
      updatedAt: previous.updatedAt,
    };
  }

  const summary =
    (await summarizeCreativeMarketItems(feed.items)) ??
    fallbackCreativeMarketSummary(feed.items);

  console.log('[llm] creativemarket summary regenerated');
  return { ...feed, summary, contentFingerprint };
}

export async function attachHumbleBundleSummaries(
  feed: LiveFeed,
  previous: LiveFeed | null,
): Promise<LiveFeed> {
  const contentFingerprint = feedItemsFingerprint(feed.items);
  const groups = groupBundlesByCategory(feed.items);
  const previousSummaries = previous?.summaries ?? {};
  const previousCategoryFingerprints = previous?.categoryFingerprints ?? {};

  const summaries: Partial<Record<HumbleBundleCategory, string>> = {};
  const categoryFingerprints: Partial<Record<HumbleBundleCategory, string>> =
    {};

  const contentChanged =
    !previous || previous.contentFingerprint !== contentFingerprint;

  let regenerated = 0;

  for (const category of HB_CATEGORIES) {
    const items = groups[category];
    const fingerprint = feedItemsFingerprint(items);
    categoryFingerprints[category] = fingerprint;

    if (items.length === 0) continue;

    if (
      previousCategoryFingerprints[category] === fingerprint &&
      previousSummaries[category]
    ) {
      summaries[category] = previousSummaries[category];
      continue;
    }

    summaries[category] =
      (await summarizeHumbleBundleCategory(category, items)) ??
      fallbackHumbleBundleCategorySummary(category, items);
    regenerated += 1;
  }

  if (regenerated > 0) {
    console.log(
      `[llm] humblebundle regenerated ${regenerated} category summaries`,
    );
  }

  return {
    ...feed,
    summaries,
    categoryFingerprints,
    contentFingerprint,
    updatedAt:
      regenerated > 0 || contentChanged
        ? feed.updatedAt
        : (previous?.updatedAt ?? feed.updatedAt),
  };
}
