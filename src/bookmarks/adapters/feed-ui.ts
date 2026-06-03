import type { LiveFeedItem } from './types';
import { itemDescriptionFromShop } from '../../utils/feed-item-text';
import { formatItemExpiresAtLabel } from '../../utils/feed-expiry';

export type HoverPanelOptions = {
  showImages?: boolean;
};

export type HoverPanelContent = {
  updatedAt?: string;
  summary?: string;
  items: LiveFeedItem[];
  showImages?: boolean;
};

export function createHoverRowItem(
  item: LiveFeedItem,
  description?: string,
  options: HoverPanelOptions = {},
): HTMLLIElement {
  const { showImages = false } = options;
  const li = document.createElement('li');
  li.className = 'bookmark-hover-row';
  if (showImages && item.image) {
    li.classList.add('bookmark-hover-row--with-image');
  }

  const content = document.createElement('span');
  content.className = 'bookmark-hover-row-content';

  if (showImages && item.image) {
    const img = document.createElement('img');
    img.className = 'bookmark-hover-row-thumb';
    img.src = item.image;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 40;
    img.height = 40;
    content.append(img);
  }

  const text = document.createElement('span');
  text.className = 'bookmark-hover-row-text';

  if (item.url) {
    const link = document.createElement('a');
    link.className = 'bookmark-hover-row-name';
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.title;
    text.append(link);

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = '（在新窗口打开）';
    text.append(sr);
  } else {
    const title = document.createElement('span');
    title.className = 'bookmark-hover-row-name';
    title.textContent = item.title;
    text.append(title);
  }

  const descText = description ?? itemDescriptionFromShop(item.shop);
  if (descText) {
    const desc = document.createElement('span');
    desc.className = 'bookmark-hover-row-desc';
    desc.textContent = descText;
    text.append(desc);
  }

  if (item.expiresAt) {
    const expiry = document.createElement('span');
    expiry.className = 'bookmark-hover-row-expiry';
    expiry.textContent = formatItemExpiresAtLabel(item.expiresAt);
    text.append(expiry);
  }

  content.append(text);
  li.append(content);
  return li;
}

export function fillHoverPanel(
  panel: HTMLElement,
  content: HoverPanelContent,
): void {
  const { updatedAt, summary, items, showImages = false } = content;
  panel.replaceChildren();

  if (updatedAt) {
    const meta = document.createElement('p');
    meta.className = 'bookmark-hover-panel-meta';
    meta.textContent = `更新于 ${updatedAt}`;
    panel.append(meta);
  }

  if (summary) {
    const summaryEl = document.createElement('p');
    summaryEl.className = 'bookmark-hover-panel-summary';
    summaryEl.textContent = summary;
    panel.append(summaryEl);
  }

  const list = document.createElement('ul');
  list.className = 'bookmark-hover-panel-list';
  list.append(
    ...items.map((item) => createHoverRowItem(item, undefined, { showImages })),
  );
  panel.append(list);
}
