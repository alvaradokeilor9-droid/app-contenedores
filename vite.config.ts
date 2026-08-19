import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // If running in GitHub Actions, automatically configure base path for GitHub Pages
  const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
  const githubRepo = process.env.GITHUB_REPOSITORY;
  const repoBasePath = githubRepo ? `/${githubRepo.split('/')[1]}/` : '/app-contenedores/';
  const base = isGithubActions ? repoBasePath : './';

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
