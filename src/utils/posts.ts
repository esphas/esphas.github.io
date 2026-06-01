const MORE_SEPARATOR = '<!-- more -->';

export function getPostSlug(post: { slug?: string; id: string }): string {
  if (post.slug) {
    return post.slug;
  }

  const basename = post.id.split(/[/\\]/).pop() ?? post.id;
  return basename.replace(/\.mdx?$/, '');
}

export function getExcerpt(body: string, maxLength = 160): string {
  const parts = body.split(MORE_SEPARATOR);
  const excerptSource = parts[0].trim();

  if (excerptSource.length <= maxLength) {
    return excerptSource;
  }

  return `${excerptSource.slice(0, maxLength).trim()}…`;
}

export function getSortedPosts<T extends { data: { date: Date } }>(posts: T[]): T[] {
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
