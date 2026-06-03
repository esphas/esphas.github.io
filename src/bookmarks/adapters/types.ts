export type LiveFeedItem = {
  title: string;
  shop?: string;
  url?: string;
  image?: string;
  /** ISO-8601 end time for this bundle/item. */
  expiresAt?: string;
};

export type LiveFeed = {
  updatedAt: string;
  sourceUrl: string;
  items: LiveFeedItem[];
  /** Creative Market: summary for the current weekly batch. */
  summary?: string;
  /** Humble Bundle: per-category summaries. */
  summaries?: Partial<Record<'books' | 'games' | 'software', string>>;
  /** Detect item-set changes to skip redundant LLM calls. */
  contentFingerprint?: string;
  categoryFingerprints?: Partial<
    Record<'books' | 'games' | 'software', string>
  >;
  /** ISO-8601 end time for the whole feed batch (e.g. CM weekly rotation). */
  expiresAt?: string;
};

type LiveAdapterMetaBase = {
  id: string;
  getLandingUrl(config: Record<string, unknown>): string;
};

/** Server-safe metadata for feed-based rows (CI scrape + JSON feed). */
export type LiveFeedAdapterMeta = LiveAdapterMetaBase & {
  strategy: 'feed';
  getFeedKey(config: Record<string, unknown>): string;
};

/** Server-safe metadata for client-hydrated rows (browser fetch). */
export type LiveClientAdapterMeta = LiveAdapterMetaBase & {
  strategy: 'client';
};

export type LiveAdapterMeta = LiveFeedAdapterMeta | LiveClientAdapterMeta;

export type LiveFeedAdapterClient = LiveFeedAdapterMeta & {
  cacheTtlMs: number;
  feedPath(feedKey: string): string;
  cacheKey(feedKey: string): string;
  fetchFeed(feedKey: string): Promise<LiveFeed | null>;
  renderRow(row: HTMLElement, feed: LiveFeed): void;
};

export type LiveClientAdapterClient = LiveClientAdapterMeta & {
  hydrateSlot(
    slot: HTMLElement,
    config: Record<string, unknown>,
  ): Promise<void>;
};

export type LiveAdapterClient = LiveFeedAdapterClient | LiveClientAdapterClient;

/** CI scrape hook; imported only from sync scripts. */
export type LiveAdapterScraper<TConfig = Record<string, unknown>> = {
  parseConfig(config: Record<string, unknown>): TConfig;
  scrape(config: TConfig): Promise<LiveFeed | null>;
};

export function isFeedAdapter(
  adapter: LiveAdapterClient | LiveAdapterMeta,
): adapter is LiveFeedAdapterClient | LiveFeedAdapterMeta {
  return adapter.strategy === 'feed';
}

export function isClientAdapter(
  adapter: LiveAdapterClient | LiveAdapterMeta,
): adapter is LiveClientAdapterClient | LiveClientAdapterMeta {
  return adapter.strategy === 'client';
}
