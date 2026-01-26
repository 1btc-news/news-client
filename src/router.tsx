import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    // Cache preloaded data for 30 seconds to benefit from hover preloading
    defaultPreloadStaleTime: 30000,
  });

  return router;
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
