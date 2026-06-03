const CM_FREE_GOODS_RESET_UTC_HOUR = 4;

export function parseFeedDateTime(value: string): Date {
  if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  return new Date(`${value}Z`);
}

export function nextCreativeMarketFreeGoodsExpiry(from = new Date()): Date {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const d = from.getUTCDate();
  const day = from.getUTCDay();
  const hour = from.getUTCHours();
  const minute = from.getUTCMinutes();
  const second = from.getUTCSeconds();

  let daysToAdd = (8 - day) % 7;
  if (daysToAdd === 0) {
    const beforeReset =
      hour < CM_FREE_GOODS_RESET_UTC_HOUR ||
      (hour === CM_FREE_GOODS_RESET_UTC_HOUR &&
        minute === 0 &&
        second === 0 &&
        from.getUTCMilliseconds() === 0);
    daysToAdd = beforeReset ? 0 : 7;
  }

  const expiry = new Date(
    Date.UTC(y, m, d + daysToAdd, CM_FREE_GOODS_RESET_UTC_HOUR, 0, 0),
  );
  if (expiry.getTime() <= from.getTime()) {
    expiry.setUTCDate(expiry.getUTCDate() + 7);
  }
  return expiry;
}

export function resolveCreativeMarketExpiresAt(
  scraped: string | null | undefined,
  from = new Date(),
): string {
  if (scraped) {
    const parsed = parseFeedDateTime(scraped);
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > from.getTime()) {
      return parsed.toISOString();
    }
  }
  return nextCreativeMarketFreeGoodsExpiry(from).toISOString();
}

export function daysUntilExpiry(expiresAt: string, from = new Date()): number {
  const expires = parseFeedDateTime(expiresAt);
  const diff = expires.getTime() - from.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function formatExpiryLabel(daysLeft: number): string {
  if (daysLeft <= 0) return '今日到期';
  return `还有 ${daysLeft} 天`;
}

export function formatItemExpiresAtLabel(expiresAt: string): string {
  const daysLeft = daysUntilExpiry(expiresAt);
  if (daysLeft <= 0) return '今日到期';

  const expires = parseFeedDateTime(expiresAt);
  const dateLabel = expires.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  });

  if (daysLeft <= 7) return `${dateLabel} 到期`;
  return `还有 ${daysLeft} 天 · ${dateLabel}`;
}
