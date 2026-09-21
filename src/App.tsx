import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RecentNews } from './routes/recent-news';
import { ViewNews } from './routes/view-news';
import { PostNews } from './routes/post-news';
import { Root404 } from './routes/root-404';
import { quantumVisualizerRoute } from './routes/quantum-visualizer';
import { Footer } from './components/footer';
import { HelmetSeo } from './components/helmet-seo';

function App() {
  return (
    <ChakraProvider>
      <BrowserRouter>
        <HelmetSeo />
        <Box minH="100vh" display="flex" flexDirection="column">
          <Box flex="1">
            <Routes>
              <Route path="/" element={<RecentNews />} />
              <Route path="/news/:id" element={<ViewNews />} />
              <Route path="/post" element={<PostNews />} />
              {/* Quantum Visualizer route */}
              <Route path={quantumVisualizerRoute.path} element={quantumVisualizerRoute.element} />
              <Route path="*" element={<Root404 />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
