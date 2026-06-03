import { creativemarketScraper } from './creativemarket-scrape';
import { humblebundleScraper } from './humblebundle-scrape';
import type { LiveAdapterScraper, LiveFeed } from './types';

const scrapers: Record<string, LiveAdapterScraper> = {
  creativemarket: creativemarketScraper,
  humblebundle: humblebundleScraper,
};

export async function scrapeLiveFeed(
  adapterId: string,
  config: Record<string, unknown>,
): Promise<LiveFeed | null> {
  const scraper = scrapers[adapterId];
  if (!scraper) return null;
  return scraper.scrape(scraper.parseConfig(config));
}
