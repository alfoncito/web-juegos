import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
import { EleventyHtmlBasePlugin } from '@11ty/eleventy';

export default (eleventyConfig) => {
	eleventyConfig.addPlugin(EleventyVitePlugin, {
		tempFolderName: '.11ty-vite',
		viteOptions: {
			clearScreen: false,
			appType: 'custom',
			server: {
				open: '/',
				hmr: true,
				mode: 'development',
				middlewareMode: true
			},
			build: {
				mode: 'production',
				sourcemap: 'true',
				manifest: true,
				rollupOptions: {
					input: 'src/js/index.js'
				},
				watch: {
					chokidar: {
						usePolling: true
					},
					include: 'src/**' //*/
				}
			},
			optimizeDeps: {
				include: ['bootstrap'],
				cache: true
			}
		}
	});
	eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
	eleventyConfig.addPassthroughCopy('src/assets');
	eleventyConfig.addWatchTarget('src/js');
	eleventyConfig.addWatchTarget('src/css');
	eleventyConfig.addPassthroughCopy('src/js');
	eleventyConfig.addPassthroughCopy('src/css');

	eleventyConfig.setServerOptions({
		liveReload: true,
		port: 8080
	});

	return {
		htmlTemplateEngine: 'njk',
		passthroughFileCopy: true,
		dir: {
			input: 'src',
			output: 'dist',
			includes: '_includes',
			layouts: '_layouts',
			data: '_data'
		}
	};
};
