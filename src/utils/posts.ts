const MORE_LINE = /^\s*<!--\s*more\s*-->\s*$/i;

export function getPostSlug(post: { slug?: string; id: string }): string {
  if (post.slug) {
    return post.slug;
  }

  const basename = post.id.split(/[/\\]/).pop() ?? post.id;
  return basename.replace(/\.mdx?$/, '');
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}…`;
}

function extractBeforeMoreLine(body: string): string | null {
  const lines = body.split('\n');
  const index = lines.findIndex((line) => MORE_LINE.test(line));

  if (index === -1) {
    return null;
  }

  return lines.slice(0, index).join('\n').trim();
}

function extractFirstParagraph(body: string): string {
  const block = body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find((part) => part.length > 0 && !/^<!--[\s\S]*?-->$/i.test(part));

  return block ? stripMarkdown(block) : '';
}

export function getPostSummary(
  post: { data: { description?: string }; body?: string },
  maxLength = 160,
): string {
  if (post.data.description) {
    return post.data.description;
  }

  const body = post.body?.trim() ?? '';
  if (!body) {
    return '';
  }

  const beforeMore = extractBeforeMoreLine(body);
  const source =
    beforeMore !== null && beforeMore.length > 0
      ? stripMarkdown(beforeMore)
      : extractFirstParagraph(body);

  return truncate(source, maxLength);
}

export function getSortedPosts<T extends { data: { date: Date } }>(
  posts: T[],
): T[] {
  return [...posts].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}

export function getPostNeighbors<T extends { slug?: string; id: string }>(
  posts: T[],
  slug: string,
): { previous: T | null; next: T | null } {
  const index = posts.findIndex((post) => getPostSlug(post) === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index === posts.length - 1 ? null : posts[index + 1],
    next: index === 0 ? null : posts[index - 1],
  };
}
