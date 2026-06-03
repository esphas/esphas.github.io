import { creativemarketClient, creativemarketMeta } from './creativemarket';
import { githubClient, githubMeta } from './github';
import { humblebundleClient, humblebundleMeta } from './humblebundle';
import type { LiveAdapterClient, LiveAdapterMeta } from './types';
import { isFeedAdapter } from './types';

const clientAdapters: Record<string, LiveAdapterClient> = {
  creativemarket: creativemarketClient,
  github: githubClient,
  humblebundle: humblebundleClient,
};

const metaAdapters: Record<string, LiveAdapterMeta> = {
  creativemarket: creativemarketMeta,
  github: githubMeta,
  humblebundle: humblebundleMeta,
};

export const LIVE_ADAPTER_IDS = Object.keys(clientAdapters) as [
  keyof typeof clientAdapters,
  ...(keyof typeof clientAdapters)[],
];

export const LIVE_FEED_ADAPTER_IDS = LIVE_ADAPTER_IDS.filter((id) =>
  isFeedAdapter(clientAdapters[id]),
);

export function getLiveAdapterClient(
  id: string,
): LiveAdapterClient | undefined {
  return clientAdapters[id];
}

export function getLiveAdapterMeta(id: string): LiveAdapterMeta | undefined {
  return metaAdapters[id];
}
