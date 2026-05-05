import '@fontsource/open-sans';
import { ChakraProvider } from '@chakra-ui/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Fonts from './components/fonts';
import theme from './style/theme';
import './style/news.css';
import Root404 from './routes/root-404';
import PostNews from './routes/post-news';
import ViewNews from './routes/view-news';
import RecentNews from './routes/recent-news';
import MoltbookInscription from './routes/moltbook-inscription';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RecentNews />,
    errorElement: <Root404 />,
  },
  {
    path: '/post-news',
    element: <PostNews />,
  },
  {
    path: '/view-news',
    element: <ViewNews />,
  },
  {
    path: '/moltbook-inscription',
    element: <MoltbookInscription />,
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