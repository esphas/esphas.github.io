const SITE_HOSTS = new Set(['icefla.me', 'www.icefla.me', 'localhost']);

const NEW_WINDOW_SR_TEXT = '（在新窗口打开）';

function walk(node, visit) {
  visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child, visit);
    }
  }
}

function isExternal(href) {
  if (typeof href !== 'string') return false;
  if (href.startsWith('#') || href.startsWith('/')) return false;
  try {
    const { hostname } = new URL(href);
    return !SITE_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

function newWindowSrOnlySpan() {
  return {
    type: 'element',
    tagName: 'span',
    properties: { className: ['sr-only'] },
    children: [{ type: 'text', value: NEW_WINDOW_SR_TEXT }],
  };
}

export function rehypeHarden() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'element') return;

      if (node.tagName === 'a') {
        const href = node.properties?.href;
        if (!isExternal(href)) return;
        node.properties.target = '_blank';
        node.properties.rel = ['noopener', 'noreferrer'];
        if (!Array.isArray(node.children)) {
          node.children = [];
        }
        node.children.push(newWindowSrOnlySpan());
        return;
      }

      if (node.tagName === 'img') {
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
        if (node.properties.alt === undefined) {
          node.properties.alt = '';
        }
      }
    });
  };
}
