import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Link,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { QuantumData, QuantumDeveloper } from '../../lib/api-types';

const DATA_URL =
  'https://quantum-power-map.p-d07.workers.dev/data.json';

export const QuantumVisualizer = () => {
  const [data, setData] = useState<QuantumData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await fetch(DATA_URL);
        if (!resp.ok) {
          throw new Error(`Network response was not ok (${resp.status})`);
        }
        const json = (await resp.json()) as QuantumData;
        setData(json);
      } catch (e: any) {
        setError(e.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading Quantum Visualizer…</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load data: {error}
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const { readinessIndex, developers } = data;

  return (
    <Box maxW="container.lg" mx="auto" p={4}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl">
            Bitcoin Quantum Readiness Index
          </Heading>
          <Text fontSize="4xl" fontWeight="bold" color={readinessIndex > 50 ? 'red.500' : 'green.500'}>
            {readinessIndex} / 100
          </Text>
          <Text mt={2} color="gray.600">
            Updated daily – source: <Link href={DATA_URL} isExternal>quantum‑power‑map</Link>
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Top Developers (by Quantum‑Risk Score)
          </Heading>
          {developers.slice(0, 20).map((dev: QuantumDeveloper, idx: number) => (
            <HStack
              key={dev.name}
              justify="space-between"
              p={2}
              borderBottomWidth={1}
              borderColor="gray.200"
            >
              <Text fontWeight="medium">
                {idx + 1}. {dev.name}
              </Text>
              <Badge colorScheme={dev.score > 70 ? 'green' : dev.score > 40 ? 'yellow' : 'red'}>
                {dev.score}
              </Badge>
              {dev.position && (
                <Text fontSize="sm" color="gray.500" noOfLines={1}>
                  {dev.position}
                </Text>
              )}
              {dev.sourceUrl && (
                <Link href={dev.sourceUrl} isExternal fontSize="sm" color="blue.500">
                  source
                </Link>
              )}
            </HStack>
          ))}
        </Box>
      </VStack>
    </Box>
  );
};
