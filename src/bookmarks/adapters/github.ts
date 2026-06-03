import { createStatIcon } from '../../utils/icon';
import { fetchGithubRepoStats, type GithubRepoStats } from '../../utils/github';
import type { LiveClientAdapterClient, LiveClientAdapterMeta } from './types';

const REPO_PATTERN = /^[^/\s]+\/[^/\s]+$/;

export type GithubAdapterConfig = {
  repo: string;
};

export function parseGithubConfig(
  config: Record<string, unknown>,
): GithubAdapterConfig {
  const repo = typeof config.repo === 'string' ? config.repo : '';
  if (!REPO_PATTERN.test(repo)) {
    throw new Error('GitHub adapter config.repo 应为 owner/repo 格式');
  }
  return { repo };
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatStatsAriaLabel(stats: GithubRepoStats): string {
  const parts = [
    `${stats.stars.toLocaleString('zh-CN')} stars`,
    `最近推送 ${formatIsoDate(stats.pushedAt)}`,
  ];
  if (stats.latestRelease) {
    parts.push(`Release ${stats.latestRelease}`);
  }
  return parts.join('，');
}

async function createStatItem(
  iconName: 'star' | 'clock' | 'tag',
  value: string,
  label: string,
): Promise<HTMLSpanElement> {
  const item = document.createElement('span');
  item.className = 'list-item-stat';

  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = `${label} `;

  const val = document.createElement('span');
  val.className = 'list-item-stat-value';
  val.textContent = value;

  item.append(await createStatIcon(iconName), sr, val);
  return item;
}

async function renderGithubStats(
  slot: HTMLElement,
  stats: GithubRepoStats,
): Promise<void> {
  slot.replaceChildren(
    await createStatItem(
      'star',
      stats.stars.toLocaleString('zh-CN'),
      'Star 数',
    ),
    await createStatItem('clock', formatIsoDate(stats.pushedAt), '最近推送'),
  );

  if (stats.latestRelease) {
    slot.append(await createStatItem('tag', stats.latestRelease, 'Release'));
  }

  slot.classList.remove('is-loading');
  slot.removeAttribute('aria-busy');
  slot.setAttribute('aria-label', formatStatsAriaLabel(stats));
}

function renderGithubUnavailable(slot: HTMLElement): void {
  const item = document.createElement('span');
  item.className = 'list-item-stat';

  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = '仓库数据 ';

  const val = document.createElement('span');
  val.className = 'list-item-stat-value';
  val.textContent = '—';

  item.append(sr, val);
  slot.replaceChildren(item);
  slot.classList.remove('is-loading');
  slot.removeAttribute('aria-busy');
  slot.setAttribute('aria-label', '仓库数据暂时不可用');
}

export const githubMeta: LiveClientAdapterMeta = {
  id: 'github',
  strategy: 'client',
  getLandingUrl: (config) =>
    `https://github.com/${parseGithubConfig(config).repo}`,
};

export const githubClient: LiveClientAdapterClient = {
  ...githubMeta,
  async hydrateSlot(slot, config) {
    const { repo } = parseGithubConfig(config);
    const stats = await fetchGithubRepoStats(repo);
    if (!stats) {
      renderGithubUnavailable(slot);
      return;
    }

    await renderGithubStats(slot, stats);
  },
};
