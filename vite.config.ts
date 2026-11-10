import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const projectRoot = fs.realpathSync(process.cwd());

// https://vitejs.dev/config/
export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, './src'),
      '@/modules': path.resolve(projectRoot, './src/modules'),
      '@/services': path.resolve(projectRoot, './src/services'),
      '@/styles': path.resolve(projectRoot, './src/styles')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1024
  },
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/*.md', '**/.git/**', '**/dist/**']
    }
  }
});
