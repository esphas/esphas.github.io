export type CreativeMarketRawItem = {
  title: string;
  shop?: string;
  url: string;
  imageUrl?: string;
};

export type CreativeMarketPageData = {
  items: CreativeMarketRawItem[];
  scrapedExpiresAt: string | null;
};

/**
 * Self-contained DOM parser for page.evaluate — must not call external helpers.
 */
export function extractCreativeMarketPageFromDom(): CreativeMarketPageData {
  const items: CreativeMarketRawItem[] = [];

  for (const card of document.querySelectorAll('.free-asset-card')) {
    const link = card.querySelector('a.free-asset-card__product-details');
    const title = card
      .querySelector('.free-asset-card__product-title')
      ?.textContent?.trim();
    const shop = card
      .querySelector('.free-asset-card__shop-name')
      ?.textContent?.trim();
    const imageEl = card.querySelector('.free-asset-card__image');
    const imageUrl =
      imageEl instanceof HTMLImageElement ? imageEl.src : undefined;
    const href = link instanceof HTMLAnchorElement ? link.href : undefined;

    if (!title || !href) continue;
    items.push({ title, shop, url: href, imageUrl });
  }

  const featured = document.querySelector('.featured-asset');
  if (featured) {
    const link = featured.querySelector('.featured-asset__product-name');
    const title = link?.textContent?.trim();
    const href = link instanceof HTMLAnchorElement ? link.href : undefined;
    const shop = featured
      .querySelector('.featured-asset__shop-name')
      ?.textContent?.trim();
    const imageEl = featured.querySelector('.featured-asset__main-image');
    const imageUrl =
      imageEl instanceof HTMLImageElement ? imageEl.src : undefined;

    if (title && href) {
      items.unshift({ title, shop, url: href, imageUrl });
    }
  }

  const seen = new Set<string>();
  const merged: CreativeMarketRawItem[] = [];
  for (const item of items) {
    const key = item.url.split('?')[0] ?? item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  const html = document.documentElement.innerHTML;
  const expiryPatterns = [
    /"expires_at"\s*:\s*"([^"]+)"/i,
    /"expiresAt"\s*:\s*"([^"]+)"/i,
    /"end_date"\s*:\s*"([^"]+)"/i,
    /"countdown_end"\s*:\s*"([^"]+)"/i,
    /"free_goods_reset(?:_at)?"\s*:\s*"([^"]+)"/i,
    /data-expires=["']([^"']+)["']/i,
    /data-countdown-end=["']([^"']+)["']/i,
  ];
  let scrapedExpiresAt: string | null = null;
  for (const pattern of expiryPatterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const raw = match[1];
    const normalized =
      /[zZ]$/.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
      scrapedExpiresAt = parsed.toISOString();
      break;
    }
  }

  return { items: merged, scrapedExpiresAt };
}
