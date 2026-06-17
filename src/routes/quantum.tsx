import React from 'react';
import { QuantumVisualizer } from '../components/QuantumVisualizer';

const QuantumRoute: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      <QuantumVisualizer />
    </div>
  );
};

export default QuantumRoute;
