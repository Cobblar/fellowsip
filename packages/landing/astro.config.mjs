import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  server: {
    port: 4321,
    host: true
  },
  vite: {
    server: {
      allowedHosts: ['fellowsip.cobbler.cc', '.cobbler.cc', 'localhost', '127.0.0.1']
    }
  }
});
