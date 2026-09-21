/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { QuantumVisualizer } from '../components/QuantumVisualizer';
import '@testing-library/jest-dom';

const mockData = {
  readinessIndex: 42,
  developers: [
    {
      name: 'Alice',
      score: 85,
      position: 'Core Maintainer',
      sourceUrl: 'https://example.com/alice',
    },
    {
      name: 'Bob',
      score: 30,
    },
  ],
};

beforeAll(() => {
  // Mock the global fetch
  // @ts-ignore
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData),
    })
  );
});

afterAll(() => {
  // @ts-ignore
  global.fetch.mockRestore();
});

test('renders loading state then displays data', async () => {
  render(<QuantumVisualizer />);

  // Loading spinner should be present initially
  expect(screen.getByText(/Loading Quantum Visualizer/i)).toBeInTheDocument();

  // Wait for data to be rendered
  await waitFor(() => {
    expect(screen.getByText(/Bitcoin Quantum Readiness Index/i)).toBeInTheDocument();
  });

  // Verify index value
  expect(screen.getByText('42 / 100')).toBeInTheDocument();

  // Verify developer entries
  expect(screen.getByText(/Alice/)).toBeInTheDocument();
  expect(screen.getByText(/85/)).toBeInTheDocument();
  expect(screen.getByText(/Core Maintainer/)).toBeInTheDocument();

  expect(screen.getByText(/Bob/)).toBeInTheDocument();
  expect(screen.getByText(/30/)).toBeInTheDocument();
});
