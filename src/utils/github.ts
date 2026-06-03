export type GithubRepoStats = {
  stars: number;
  pushedAt: Date;
  latestRelease: string | null;
};

type CachedGithubRepoStats = {
  stars: number;
  pushedAt: string;
  latestRelease: string | null;
};

type CacheEntry = {
  fetchedAt: number;
  stats: CachedGithubRepoStats;
};

const GITHUB_API = 'https://api.github.com';
const CACHE_PREFIX = 'momokoi:github-stats:';
export const GITHUB_STATS_CACHE_TTL_MS = 10 * 60 * 1000;

const inflight = new Map<string, Promise<GithubRepoStats | null>>();

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Momokoi-Bookmarks',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (typeof process !== 'undefined' && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function cacheKey(repo: string): string {
  return `${CACHE_PREFIX}${repo}`;
}

function readCache(repo: string): GithubRepoStats | null {
  if (typeof sessionStorage === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(cacheKey(repo));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.fetchedAt > GITHUB_STATS_CACHE_TTL_MS) {
      sessionStorage.removeItem(cacheKey(repo));
      return null;
    }

    return {
      stars: entry.stats.stars,
      pushedAt: new Date(entry.stats.pushedAt),
      latestRelease: entry.stats.latestRelease,
    };
  } catch {
    return null;
  }
}

function writeCache(repo: string, stats: GithubRepoStats): void {
  if (typeof sessionStorage === 'undefined') return;

  try {
    const entry: CacheEntry = {
      fetchedAt: Date.now(),
      stats: {
        stars: stats.stars,
        pushedAt: stats.pushedAt.toISOString(),
        latestRelease: stats.latestRelease,
      },
    };
    sessionStorage.setItem(cacheKey(repo), JSON.stringify(entry));
  } catch {
    // Quota exceeded or private mode; skip caching.
  }
}

async function fetchGithubRepoStatsFromApi(
  repo: string,
): Promise<GithubRepoStats | null> {
  const [owner, name] = repo.split('/');
  if (!owner || !name) return null;

  try {
    const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${name}`, {
      headers: githubHeaders(),
    });
    if (!repoRes.ok) return null;

    const repoData = (await repoRes.json()) as {
      stargazers_count: number;
      pushed_at: string;
    };

    let latestRelease: string | null = null;
    const releaseRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${name}/releases/latest`,
      { headers: githubHeaders() },
    );
    if (releaseRes.ok) {
      const release = (await releaseRes.json()) as { tag_name?: string };
      latestRelease = release.tag_name ?? null;
    }

    return {
      stars: repoData.stargazers_count,
      pushedAt: new Date(repoData.pushed_at),
      latestRelease,
    };
  } catch {
    return null;
  }
}

export async function fetchGithubRepoStats(
  repo: string,
): Promise<GithubRepoStats | null> {
  const cached = readCache(repo);
  if (cached) return cached;

  const pending = inflight.get(repo);
  if (pending) return pending;

  const request = fetchGithubRepoStatsFromApi(repo).then((stats) => {
    inflight.delete(repo);
    if (stats) writeCache(repo, stats);
    return stats;
  });

  inflight.set(repo, request);
  return request;
}
