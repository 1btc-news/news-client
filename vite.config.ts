import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function vendorChunk(id: string) {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/react-router') ||
    id.includes('/react-helmet')
  ) {
    return 'react-vendor';
  }

  if (
    id.includes('/@chakra-ui/') ||
    id.includes('/@emotion/') ||
    id.includes('/framer-motion/')
  ) {
    return 'ui-vendor';
  }

  if (
    id.includes('/react-markdown/') ||
    id.includes('/remark-') ||
    id.includes('/rehype-') ||
    id.includes('/markdown-it/') ||
    id.includes('/chakra-ui-markdown-renderer/')
  ) {
    return 'markdown-vendor';
  }

  return 'vendor';
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
});
