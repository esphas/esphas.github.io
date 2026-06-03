const STAT_ICONS = {
  star: 'lucide:star',
  clock: 'lucide:clock',
  tag: 'lucide:tag',
} as const;

export type StatIconName = keyof typeof STAT_ICONS;

let iconifyReady: Promise<void> | null = null;

function ensureIconifyLoaded(): Promise<void> {
  if (!iconifyReady) {
    iconifyReady = import('iconify-icon').then(() => undefined);
  }
  return iconifyReady;
}

export async function createStatIcon(name: StatIconName): Promise<HTMLElement> {
  await ensureIconifyLoaded();

  const el = document.createElement('iconify-icon');
  el.setAttribute('icon', STAT_ICONS[name]);
  el.setAttribute('width', '14');
  el.setAttribute('height', '14');
  el.setAttribute('aria-hidden', 'true');
  el.className = 'list-item-stat-icon';
  return el;
}
