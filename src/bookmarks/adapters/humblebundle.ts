import { fillHoverPanel } from './feed-ui';
import { createFetchFeed, finishLoadingRow } from './feed-client';
import {
  humbleBundleCategoryFromUrl,
  type HumbleBundleCategory,
} from './humblebundle-parse';
import type {
  LiveFeed,
  LiveFeedAdapterClient,
  LiveFeedAdapterMeta,
  LiveFeedItem,
} from './types';

export const HUMBLE_BUNDLE_DEFAULT_LANDING_URL =
  'https://www.humblebundle.com/bundles';

export type HumbleBundleConfig = {
  landingUrl: string;
  feedKey: string;
  maxItems: number;
};

export function parseHumbleBundleConfig(
  config: Record<string, unknown>,
): HumbleBundleConfig {
  const landingUrl =
    typeof config.landingUrl === 'string'
      ? config.landingUrl
      : HUMBLE_BUNDLE_DEFAULT_LANDING_URL;
  const feedKey =
    typeof config.feedKey === 'string'
      ? config.feedKey
      : 'humblebundle/bundles';
  const maxItems =
    typeof config.maxItems === 'number' && config.maxItems > 0
      ? Math.floor(config.maxItems)
      : 40;

  return { landingUrl, feedKey, maxItems };
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const feedPath = (feedKey: string) => `/feeds/${feedKey}.json`;
const cacheKey = (feedKey: string) => `momokoi:live:${feedKey}`;

export const HUMBLE_BUNDLE_CATEGORY_LABELS: Record<
  HumbleBundleCategory,
  string
> = {
  books: '书籍',
  games: '游戏',
  software: '软件',
};

export function groupBundlesByCategory(
  items: LiveFeedItem[],
): Record<HumbleBundleCategory, LiveFeedItem[]> {
  const groups: Record<HumbleBundleCategory, LiveFeedItem[]> = {
    books: [],
    games: [],
    software: [],
  };

  for (const item of items) {
    const category = humbleBundleCategoryFromUrl(item.url);
    if (category) groups[category].push(item);
  }

  return groups;
}

function bindLazyCategoryPanel(
  details: HTMLDetailsElement,
  feed: LiveFeed,
  category: HumbleBundleCategory,
  items: LiveFeedItem[],
): void {
  const fillPanel = (): void => {
    if (details.dataset.livePanelFilled === 'true') return;

    const hoverPanel = details.querySelector('[data-live-hover]');
    if (!(hoverPanel instanceof HTMLElement) || items.length === 0) return;

    fillHoverPanel(hoverPanel, {
      updatedAt: feed.updatedAt,
      summary: feed.summaries?.[category],
      items,
    });
    details.dataset.livePanelFilled = 'true';
  };

  details.addEventListener('toggle', () => {
    if (details.open) fillPanel();
  });

  if (details.open) fillPanel();
}

export const humblebundleMeta: LiveFeedAdapterMeta = {
  id: 'humblebundle',
  strategy: 'feed',
  getLandingUrl: (config) => parseHumbleBundleConfig(config).landingUrl,
  getFeedKey: (config) => parseHumbleBundleConfig(config).feedKey,
};

export const humblebundleClient: LiveFeedAdapterClient = {
  ...humblebundleMeta,
  cacheTtlMs: CACHE_TTL_MS,
  feedPath,
  cacheKey,
  fetchFeed: createFetchFeed({ feedPath, cacheKey, cacheTtlMs: CACHE_TTL_MS }),
  renderRow(row, feed) {
    const groups = groupBundlesByCategory(feed.items);

    for (const category of Object.keys(groups) as HumbleBundleCategory[]) {
      const badge = row.querySelector(`[data-live-category="${category}"]`);
      if (!(badge instanceof HTMLDetailsElement)) continue;

      const items = groups[category];
      const countEl = badge.querySelector('[data-live-count]');
      if (countEl instanceof HTMLElement) {
        countEl.textContent = items.length > 0 ? ` (${items.length})` : '';
      }

      if (items.length > 0) {
        bindLazyCategoryPanel(badge, feed, category, items);
      }
    }

    finishLoadingRow(row);
  },
};
