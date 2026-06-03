import { creativemarketClient } from './creativemarket';
import { humblebundleClient } from './humblebundle';
import type { LiveFeedAdapterClient } from './types';

const feedAdapters: Record<string, LiveFeedAdapterClient> = {
  creativemarket: creativemarketClient,
  humblebundle: humblebundleClient,
};

export function getLiveFeedAdapterClient(
  id: string,
): LiveFeedAdapterClient | undefined {
  return feedAdapters[id];
}
