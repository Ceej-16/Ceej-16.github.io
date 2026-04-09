// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://Ceej-16.github.io',
	integrations: [
		starlight({
			title: 'Ceej Cyber Lab',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Ceej-16' }],
			sidebar: [
  {
    autogenerate: { directory: '.' },
  },
],
		}),
	],
});
