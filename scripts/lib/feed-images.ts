import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { LiveFeedItem } from '../../src/bookmarks/adapters/types';

const USER_AGENT = 'Momokoi-FeedSync/1.0 (+https://icefla.me)';

export type ItemWithRemoteImage = LiveFeedItem & { imageUrl?: string };

export function productSlugFromUrl(productUrl: string): string {
  const segment =
    new URL(productUrl).pathname.split('/').filter(Boolean).pop() ?? 'item';
  return segment
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 96);
}

function extFromContentType(contentType: string | null): string {
  if (!contentType) return 'jpg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

function findExistingImage(imagesDir: string, slug: string): string | null {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
    const filePath = path.join(imagesDir, `${slug}.${ext}`);
    if (existsSync(filePath)) return `${slug}.${ext}`;
  }
  return null;
}

async function downloadImage(
  url: string,
  imagesDir: string,
  slug: string,
): Promise<string | null> {
  const existing = findExistingImage(imagesDir, slug);
  if (existing) return existing;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Referer: 'https://creativemarket.com/',
      },
    });
    if (!res.ok) return null;

    const ext = extFromContentType(res.headers.get('content-type'));
    const filename = `${slug}.${ext}`;
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(path.join(imagesDir, filename), buffer);
    return filename;
  } catch {
    return null;
  }
}

export async function localizeFeedImages(
  feedKey: string,
  items: ItemWithRemoteImage[],
  feedsRoot = path.join(process.cwd(), 'feeds'),
): Promise<LiveFeedItem[]> {
  const imagesDir = path.join(feedsRoot, feedKey, 'images');
  mkdirSync(imagesDir, { recursive: true });
  const publicPrefix = `/feeds/${feedKey}/images`;

  const localized: LiveFeedItem[] = [];

  for (const item of items) {
    const { imageUrl, image: existingImage, ...rest } = item;
    let image = existingImage;

    if (imageUrl) {
      const slug = rest.url
        ? productSlugFromUrl(rest.url)
        : createHash('sha1').update(rest.title).digest('hex').slice(0, 12);
      const filename = await downloadImage(imageUrl, imagesDir, slug);
      if (filename) {
        image = `${publicPrefix}/${filename}`;
      }
    }

    localized.push(image ? { ...rest, image } : rest);
  }

  return localized;
}

export function mergePreviousImages(
  items: LiveFeedItem[],
  previous: LiveFeedItem[] | null | undefined,
): LiveFeedItem[] {
  if (!previous?.length) return items;

  const prevByUrl = new Map(
    previous
      .filter((item) => item.url && item.image)
      .map((item) => [item.url!, item.image!]),
  );

  return items.map((item) => ({
    ...item,
    image: item.image ?? (item.url ? prevByUrl.get(item.url) : undefined),
  }));
}
