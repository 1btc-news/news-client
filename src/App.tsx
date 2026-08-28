import '@fontsource/open-sans';
import { ChakraProvider, Center, Spinner } from '@chakra-ui/react';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Fonts from './components/fonts';
import theme from './style/theme';
import './style/news.css';

const Root404 = lazy(() => import('./routes/root-404'));
const PostNews = lazy(() => import('./routes/post-news'));
const ViewNews = lazy(() => import('./routes/view-news'));
const RecentNews = lazy(() => import('./routes/recent-news'));

function RouteFallback() {
  return (
    <Center minH="100vh">
      <Spinner
        size="xl"
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.700"
        color="orange.400"
        aria-label="Loading page"
      />
    </Center>
  );
}

function withSuspense(element: JSX.Element) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(<RecentNews />),
    errorElement: withSuspense(<Root404 />),
  },
  {
    path: '/post-news',
    element: withSuspense(<PostNews />),
  },
  {
    path: '/view-news',
    element: withSuspense(<ViewNews />),
  },
]);

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <Fonts />
      <RouterProvider router={router} />
    </ChakraProvider>
  );
}
