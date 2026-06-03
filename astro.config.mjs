import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { rehypeHarden } from './src/plugins/rehype-harden.mjs';

export default defineConfig({
  site: 'https://icefla.me',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    processor: unified({ rehypePlugins: [rehypeHarden] }),
  },
});
