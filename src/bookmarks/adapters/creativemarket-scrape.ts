import { chromium, type Browser } from 'playwright';

import {
  localizeFeedImages,
  mergePreviousImages,
} from '../../../scripts/lib/feed-images';
import { attachCreativeMarketSummary } from '../../../scripts/lib/feed-summaries';
import { resolveCreativeMarketExpiresAt } from '../../utils/feed-expiry';
import { readSeedFeed } from '../../utils/feed-seed';
import {
  extractCreativeMarketPageFromDom,
  type CreativeMarketRawItem,
} from './creativemarket-parse';
import {
  parseCreativeMarketConfig,
  type CreativeMarketConfig,
} from './creativemarket';
import type { LiveFeed } from './types';

const STEALTH_ARGS = ['--disable-blink-features=AutomationControlled'];
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

type CreativeMarketScrapeResult = {
  items: CreativeMarketRawItem[];
  scrapedExpiresAt: string | null;
};

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: STEALTH_ARGS,
    });
  } catch {
    return await chromium.launch({ headless: true, args: STEALTH_ARGS });
  }
}

async function scrapeCreativeMarketPage(
  landingUrl: string,
): Promise<CreativeMarketScrapeResult | null> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: USER_AGENT,
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    const page = await context.newPage();
    await page.goto(landingUrl, {
      waitUntil: 'networkidle',
      timeout: 120_000,
    });
    await page.waitForSelector('.free-asset-card', { timeout: 60_000 });

    const pageData = await page.evaluate(extractCreativeMarketPageFromDom);
    return pageData.items.length > 0 ? pageData : null;
  } catch (error) {
    console.warn('[creativemarket] scrape failed', error);
    return null;
  } finally {
    await browser?.close();
  }
}

async function buildFeed(
  config: CreativeMarketConfig,
  rawItems: CreativeMarketRawItem[],
  scrapedExpiresAt: string | null,
  previous: LiveFeed | null,
): Promise<LiveFeed> {
  const withRemoteImages = rawItems.map(({ imageUrl, ...item }) => ({
    ...item,
    imageUrl,
  }));

  const localized = await localizeFeedImages(config.feedKey, withRemoteImages);
  const items = mergePreviousImages(localized, previous?.items);

  const feed: LiveFeed = {
    updatedAt: new Date().toISOString().slice(0, 10),
    expiresAt: resolveCreativeMarketExpiresAt(scrapedExpiresAt),
    sourceUrl: config.landingUrl,
    items,
  };

  return attachCreativeMarketSummary(feed, previous);
}

export async function scrapeCreativeMarketFeed(
  config: CreativeMarketConfig,
): Promise<LiveFeed | null> {
  const previous = readSeedFeed(config.feedKey);
  const scraped = await scrapeCreativeMarketPage(config.landingUrl);

  if (scraped) {
    return buildFeed(config, scraped.items, scraped.scrapedExpiresAt, previous);
  }

  if (!previous) return null;

  const backfilled = await localizeFeedImages(
    config.feedKey,
    previous.items.map((item) => ({ ...item })),
  );
  const items = mergePreviousImages(backfilled, previous.items);

  const hasImages = items.some((item) => item.image);
  if (!hasImages) {
    return attachCreativeMarketSummary(
      {
        ...previous,
        expiresAt: resolveCreativeMarketExpiresAt(previous.expiresAt),
      },
      previous,
    );
  }

  return attachCreativeMarketSummary(
    {
      ...previous,
      items,
      expiresAt: resolveCreativeMarketExpiresAt(previous.expiresAt),
    },
    previous,
  );
}

export const creativemarketScraper = {
  parseConfig: parseCreativeMarketConfig,
  scrape: scrapeCreativeMarketFeed,
};
