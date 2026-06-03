import { githubClient } from '../../bookmarks/adapters/github';

async function hydrateSlot(slot: HTMLElement): Promise<void> {
  const adapterId = slot.dataset.liveAdapter;
  const configRaw = slot.dataset.liveConfig;
  if (!adapterId || !configRaw || adapterId !== githubClient.id) return;

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(configRaw) as Record<string, unknown>;
  } catch {
    return;
  }

  await githubClient.hydrateSlot(slot, config);
}

export async function initBookmarkGithubLive(): Promise<void> {
  const slots = document.querySelectorAll<HTMLElement>('[data-live-slot]');
  if (slots.length === 0) return;

  await Promise.all([...slots].map((slot) => hydrateSlot(slot)));
}
