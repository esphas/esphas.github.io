function isDescTruncated(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth + 1;
}

function updateDescWrap(wrap: HTMLDetailsElement): void {
  const summary = wrap.querySelector('.bookmark-row-desc');
  if (!(summary instanceof HTMLElement)) return;

  wrap.classList.remove(
    'bookmark-row-desc-wrap--pending',
    'bookmark-row-desc-wrap--truncated',
    'bookmark-row-desc-wrap--full',
  );

  if (isDescTruncated(summary)) {
    wrap.classList.add('bookmark-row-desc-wrap--truncated');
    return;
  }

  wrap.classList.add('bookmark-row-desc-wrap--full');
  wrap.open = false;
}

function refreshAllDescWraps(): void {
  for (const wrap of document.querySelectorAll<HTMLDetailsElement>(
    '[data-bookmark-desc]',
  )) {
    updateDescWrap(wrap);
  }
}

export function initBookmarkDescExpand(): void {
  refreshAllDescWraps();

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshAllDescWraps, 150);
  });
}
