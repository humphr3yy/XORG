import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Use relative paths for assets (crucial for Electron)
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
    }
});
