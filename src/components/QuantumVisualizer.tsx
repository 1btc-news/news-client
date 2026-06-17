import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  Select,
  Tooltip,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface Developer {
  rank: number;
  name: string;
  affiliation: string;
  role: string;
  quantum_urgency_score: number;
  pq_work_volume: number;
  summary: string;
  sources: string[];
}

interface QuantumData {
  metadata: {
    title: string;
    quantum_readiness_index: {
      composite_readiness: {
        score: number;
        current_level: string;
      };
    };
  };
  developers: Developer[];
}

const COLORS = {
  1: '#3182ce', // Blue - No known view
  2: '#63b3ed', // Light Blue - Dismissive
  3: '#ecc94b', // Yellow - Cautious
  4: '#ed8936', // Orange - Proactive
  5: '#e53e3e', // Red - Urgent
};

export const QuantumVisualizer: React.FC = () => {
  const [data, setData] = useState<QuantumData | null>(null);
  const [selectedDev, setSelectedDev] = useState<Developer | null>(null);
  const [filterAffiliation, setFilterAffiliation] = useState<string>('All');
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetch('https://quantum-power-map.p-d07.workers.dev/data.json')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Failed to fetch quantum data:', err));
  }, []);

  const handleDevClick = (dev: Developer) => {
    setSelectedDev(dev);
    onOpen();
  };

  if (!data) return <Box p={10} textAlign="center">Loading Quantum Map...</Box>;

  const affiliations = ['All', ...new Set(data.developers.map((d) => d.affiliation))];
  const filteredDevs = filterAffiliation === 'All' 
    ? data.developers 
    : data.developers.filter((d) => d.affiliation === filterAffiliation);

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={2}>
            {data.metadata.title}
          </Heading>
          <HStack justify="center" spacing={4}>
            <Badge colorScheme="red" fontSize="lg" p={2}>
              Readiness Index: {data.metadata.quantum_readiness_index.composite_readiness.score}/100
            </Badge>
            <Text fontWeight="bold">Status: {data.metadata.quantum_readiness_index.composite_readiness.current_level}</Text>
          </HStack>
        </Box>

        <Flex justify="center" mb={4}>
          <Select 
            maxW="300px" 
            placeholder="Filter by Affiliation" 
            onChange={(e) => setFilterAffiliation(e.target.value)}
          >
            {affiliations.filter(a => a !== 'All').map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </Flex>

        <Box 
          position="relative" 
          width="100%" 
          height="600px" 
          bg="gray.900" 
          borderRadius="xl" 
          overflow="hidden" 
          boxShadow="2xl"
          border="1px solid"
          borderColor="gray.700"
        >
          <svg width="100%" height="100%" viewBox="0 0 1000 600">
            {filteredDevs.map((dev, i) => {
              // X: Inverse of rank (highest rank leftmost)
              const x = 100 + (dev.rank * 15);
              // Y: Urgency score (1 at bottom, 5 at top)
              const y = 550 - (dev.quantum_urgency_score * 80);
              // Radius: Work volume
              const radius = 10 + (dev.pq_work_volume * 3);

              return (
                <motion.circle
                  key={dev.name}
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={COLORS[dev.quantum_urgency_score as keyof typeof COLORS] || '#ccc'}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ scale: 1.2, stroke: '#fff', strokeWidth: 2 }}
                  onClick={() => handleDevClick(dev)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </svg>
        </Box>

        <Box textAlign="center" color="gray.500" fontSize="sm">
          <Text>X-Axis: Rank (Influence) | Y-Axis: Urgency Score | Size: PQ Work Volume</Text>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader borderBottom="1px solid" borderColor="gray.700">
            {selectedDev?.name}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {selectedDev && (
              <VStack align="start" spacing={4}>
                <HStack>
                  <Badge colorScheme={selectedDev.quantum_urgency_score === 5 ? 'red' : 'orange'}>
                    Urgency: {selectedDev.quantum_urgency_score}/5
                  </Badge>
                  <Badge colorScheme="blue">
                    Work Vol: {selectedDev.pq_work_volume}
                  </Badge>
                </HStack>
                <Text fontWeight="bold" fontSize="lg">{selectedDev.role}</Text>
                <Text color="gray.400">{selectedDev.affiliation}</Text>
                <Box p={4} bg="gray.700" borderRadius="md" borderLeft="4px solid" borderColor={COLORS[selectedDev.quantum_urgency_score as keyof typeof COLORS]}>
                  <Text italic>"{selectedDev.summary}"</Text>
                </Box>
                <VStack align="start" spacing={2} w="100%">
                  <Text fontWeight="bold">Sources:</Text>
                  {selectedDev.sources.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noopener noreferrer" color="blue.400" fontSize="sm" textDecoration="underline">
                      {src}
                    </a>
                  ))}
                </VStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};
