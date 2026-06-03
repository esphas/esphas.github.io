import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/data/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    modifiedDate: z.coerce.date().optional(),
    description: z.string().optional(),
  }),
});

const bookmarks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/bookmarks' }),
  schema: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('url'),
      order: z.string(),
      title: z.string(),
      description: z.string(),
      url: z.url(),
    }),
    z.object({
      type: z.literal('live'),
      order: z.string(),
      title: z.string(),
      description: z.string(),
      adapter: z.enum(['creativemarket', 'github', 'humblebundle']),
      config: z.record(z.string(), z.unknown()),
    }),
  ]),
});

export const collections = { posts, bookmarks };
