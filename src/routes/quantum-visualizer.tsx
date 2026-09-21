import { RouteObject } from 'react-router-dom';
import { QuantumVisualizer } from '../components/QuantumVisualizer';
import { HelmetSeo } from '../components/helmet-seo';

export const quantumVisualizerRoute: RouteObject = {
  path: '/quantum',
  element: (
    <>
      <HelmetSeo title="Quantum Visualizer – 1BTC News" />
      <QuantumVisualizer />
    </>
  ),
};
