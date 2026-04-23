// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
  site: 'https://lp-ofertas-br.com',
  compressHTML: true,
  // Adapter Cloudflare: habilita hybrid rendering (static + API routes como Worker)
  adapter: cloudflare(),
  integrations: [
    partytown({
      config: {
        // encaminha dataLayer.push do main thread para GTM no worker
        forward: ['dataLayer.push'],
      },
    }),
  ],
});
