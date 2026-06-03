export function itemDescriptionFromShop(shop?: string): string | undefined {
  if (!shop) return undefined;
  const parts = shop.split(' · ');
  if (parts.length <= 1) return shop;
  return parts.slice(1).join(' · ');
}
