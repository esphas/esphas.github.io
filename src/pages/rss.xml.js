import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';
import { getExcerpt, getPostSlug, getSortedPosts } from '../utils/posts';

export async function GET(context) {
  const posts = getSortedPosts(await getCollection('posts'));

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? getExcerpt(post.body ?? ''),
      link: `/posts/${getPostSlug(post)}/`,
    })),
  });
}
