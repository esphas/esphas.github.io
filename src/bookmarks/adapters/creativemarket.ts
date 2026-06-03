import { fillHoverPanel } from './feed-ui';
import { createFetchFeed, finishLoadingRow } from './feed-client';
import type { LiveFeedAdapterClient, LiveFeedAdapterMeta } from './types';
import {
  daysUntilExpiry,
  formatExpiryLabel,
  resolveCreativeMarketExpiresAt,
} from '../../utils/feed-expiry';

export const CREATIVE_MARKET_DEFAULT_LANDING_URL =
  'https://creativemarket.com/free-goods';

export type CreativeMarketConfig = {
  landingUrl: string;
  feedKey: string;
};

export function parseCreativeMarketConfig(
  config: Record<string, unknown>,
): CreativeMarketConfig {
  const landingUrl =
    typeof config.landingUrl === 'string'
      ? config.landingUrl
      : CREATIVE_MARKET_DEFAULT_LANDING_URL;
  const feedKey =
    typeof config.feedKey === 'string'
      ? config.feedKey
      : 'creativemarket/free-goods';

  return { landingUrl, feedKey };
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const feedPath = (feedKey: string) => `/feeds/${feedKey}.json`;
const cacheKey = (feedKey: string) => `momokoi:live:${feedKey}:v2`;

export const creativemarketMeta: LiveFeedAdapterMeta = {
  id: 'creativemarket',
  strategy: 'feed',
  getLandingUrl: (config) => parseCreativeMarketConfig(config).landingUrl,
  getFeedKey: (config) => parseCreativeMarketConfig(config).feedKey,
};

export const creativemarketClient: LiveFeedAdapterClient = {
  ...creativemarketMeta,
  cacheTtlMs: CACHE_TTL_MS,
  feedPath,
  cacheKey,
  fetchFeed: createFetchFeed({ feedPath, cacheKey, cacheTtlMs: CACHE_TTL_MS }),
  renderRow(row, feed) {
    const expiryEl = row.querySelector('[data-live-expiry]');
    const hoverPanel = row.querySelector('[data-live-hover]');

    if (expiryEl instanceof HTMLElement) {
      const expiresAt = resolveCreativeMarketExpiresAt(feed.expiresAt);
      expiryEl.textContent = formatExpiryLabel(daysUntilExpiry(expiresAt));
    }

    if (hoverPanel instanceof HTMLElement) {
      fillHoverPanel(hoverPanel, {
        updatedAt: feed.updatedAt,
        summary: feed.summary,
        items: feed.items,
        showImages: true,
      });
    }

    finishLoadingRow(row);
  },
};
