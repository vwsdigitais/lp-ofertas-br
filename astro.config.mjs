// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://lp-ofertas-br.com',
  compressHTML: true,
  adapter: cloudflare(),
});