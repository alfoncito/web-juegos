import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
// import { EleventyHtmlBasePlugin } from '@11ty/eleventy';

export default (eleventyConfig) => {
	// eleventyConfig.addPassthroughCopy('src/assets');
	// eleventyConfig.addWatchTarget('src/js');
	// eleventyConfig.addWatchTarget('src/css');
	eleventyConfig.addPassthroughCopy('src/js');
	eleventyConfig.addPassthroughCopy('src/css');
	eleventyConfig.addPassthroughCopy('public');
	
	eleventyConfig.addPlugin(EleventyVitePlugin, {
		tempFolderName: '.11ty-vite',
		viteOptions: {
			publicDir: 'public',
			clearScreen: false,
			appType: 'mpa',
			logLevel: 'warn',
			server: {
				open: '/',
				hmr: true,
				mode: 'development',
				middlewareMode: true
			},
			build: {
				emptyOutDir: true,
				mode: 'production',
				sourcemap: true,
				manifest: true,
				rollupOptions: {
					output: {
						assetFileNames: 'css/[name]-[hash].[ext]',
						chunkFileNames: 'js/[name]-[hash].js',
						entryFileNames: 'js/[name]-[hash].js'
					}
				},
				watch: {
					/*
					chokidar: {
						usePolling: true
					},
					*/
					// include: 'src/**' //*/
				}
			},
			optimizeDeps: {
				include: ['bootstrap'],
				cache: true
			}
		}
	});
	// eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

	eleventyConfig.setServerOptions({
		liveReload: true,
		port: 8080
	});

	return {
		templateFormats: ['njk', 'html'],
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
 
