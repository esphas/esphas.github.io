function closeAllBookmarkDetails(): void {
  for (const details of document.querySelectorAll<HTMLDetailsElement>(
    '.bookmark-list details[open]',
  )) {
    details.open = false;
  }
}

function isInsideOpenPanel(target: Element): boolean {
  return Boolean(
    target.closest('.bookmark-row-popover, .bookmark-row-desc-popover'),
  );
}

export function initBookmarkRowDismiss(): void {
  const list = document.querySelector('.bookmark-list');
  if (!list) return;

  list.addEventListener(
    'toggle',
    (event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;

      for (const other of list.querySelectorAll<HTMLDetailsElement>(
        'details[open]',
      )) {
        if (other !== details) other.open = false;
      }
    },
    true,
  );

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest('.bookmark-list summary')) return;
    if (isInsideOpenPanel(target)) return;

    closeAllBookmarkDetails();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAllBookmarkDetails();
  });
}
