import { getLiveFeedAdapterClient } from '../../bookmarks/adapters/feed-registry';
import { isFeedAdapter } from '../../bookmarks/adapters/types';
import { finishLoadingRow } from '../../bookmarks/adapters/feed-client';

async function loadFeedRow(row: HTMLElement): Promise<void> {
  const adapterId = row.dataset.liveAdapter;
  const feedKey = row.dataset.liveFeedKey;
  if (!adapterId || !feedKey) return;

  const adapter = getLiveFeedAdapterClient(adapterId);
  if (!adapter || !isFeedAdapter(adapter)) return;

  const feed = await adapter.fetchFeed(feedKey);
  if (!feed) {
    if (row.classList.contains('is-loading')) finishLoadingRow(row);
    return;
  }

  adapter.renderRow(row, feed);
}

export function initBookmarkFeedLive(): void {
  for (const row of document.querySelectorAll<HTMLElement>('[data-live-row]')) {
    void loadFeedRow(row);
  }
}
