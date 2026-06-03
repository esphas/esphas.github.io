import { initBookmarkDescExpand } from './desc-expand';
import { initBookmarkRowDismiss } from './dismiss';
import { initBookmarkFeedLive } from './live';
import { initBookmarkGithubLive } from './github-live';

export function initBookmarksPage(): void {
  initBookmarkFeedLive();
  initBookmarkDescExpand();
  initBookmarkRowDismiss();

  if (document.querySelector('[data-live-slot]')) {
    void initBookmarkGithubLive();
  }
}

initBookmarksPage();
