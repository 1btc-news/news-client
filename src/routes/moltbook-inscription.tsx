import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Spinner,
  Code,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { HelmetSEO } from '../components/helmet-seo';
import Footer from '../components/footer';

type MoltbookPost = {
  id: string;
  title: string;
  content: string;
  url: string;
  score: number;
  created_at: string;
};

type InscriptionResult = {
  txid: string;
  submolt: string;
  date: string;
  post: MoltbookPost;
  moltbookCommentUrl?: string;
};

const SUBMOLTS = ['m/general', 'm/crypto', 'm/technology', 'm/security', 'm/usdc', 'm/todayilearned'];

export default function MoltbookInscription() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<InscriptionResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);
  const toast = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const fetchTopPost = async (submolt: string): Promise<MoltbookPost | null> => {
    try {
      addLog(`Fetching top post for ${submolt}`);
      // This would be the actual Moltbook API call
      // For now, returning mock data
      const mockPost: MoltbookPost = {
        id: `post_${Date.now()}`,
        title: `Top post from ${submolt}`,
        content: `This is the top post content from ${submolt} for today.`,
        url: `https://moltbook.com/${submolt}/post/${Date.now()}`,
        score: Math.floor(Math.random() * 100) + 50,
        created_at: new Date().toISOString(),
      };
      return mockPost;
    } catch (error) {
      addLog(`Error fetching post from ${submolt}: ${error}`);
      return null;
    }
  };

  const inscribePost = async (post: MoltbookPost): Promise<string | null> => {
    try {
      addLog(`Inscribing post: ${post.title}`);
      // This would be the actual Bitcoin inscription API call
      // For now, returning mock txid
      const mockTxid = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      addLog(`Inscription successful. Tx ID: ${mockTxid}`);
      return mockTxid;
    } catch (error) {
      addLog(`Error inscribing post: ${error}`);
      return null;
    }
  };

  const postComment = async (submolt: string, txid: string, postUrl: string): Promise<string | null> => {
    try {
      addLog(`Posting comment to ${submolt}`);
      // This would be the actual Moltbook comment API call
      const commentText = `Top post inscribed on Bitcoin. Tx: ${txid} | Proof: ${postUrl}`;
      const mockCommentUrl = `https://moltbook.com/${submolt}/comment/${Date.now()}`;
      addLog(`Comment posted: ${mockCommentUrl}`);
      return mockCommentUrl;
    } catch (error) {
      addLog(`Error posting comment to ${submolt}: ${error}`);
      return null;
    }
  };

  const executeDaily = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setResults([]);
    setLogs([]);
    
    const today = new Date().toISOString().split('T')[0];
    addLog(`Starting daily Moltbook inscription process for ${today}`);
    
    const dailyResults: InscriptionResult[] = [];
    
    for (const submolt of SUBMOLTS) {
      try {
        addLog(`Processing ${submolt}...`);
        
        // Check if already inscribed today (mock check)
        const alreadyInscribed = Math.random() < 0.1; // 10% chance already done
        if (alreadyInscribed) {
          addLog(`${submolt} already inscribed today, skipping`);
          continue;
        }
        
        // Fetch top post
        const topPost = await fetchTopPost(submolt);
        if (!topPost) {
          addLog(`No post found for ${submolt}, skipping`);
          continue;
        }
        
        // Inscribe the post
        const txid = await inscribePost(topPost);
        if (!txid) {
          addLog(`Failed to inscribe post from ${submolt}, skipping`);
          continue;
        }
        
        // Post comment
        const commentUrl = await postComment(submolt, txid, topPost.url);
        
        const result: InscriptionResult = {
          txid,
          submolt,
          date: today,
          post: topPost,
          moltbookCommentUrl: commentUrl || undefined,
        };
        
        dailyResults.push(result);
        addLog(`Successfully processed ${submolt}`);
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        addLog(`Error processing ${submolt}: ${error}`);
      }
    }
    
    setResults(dailyResults);
    addLog(`Daily process completed. Processed ${dailyResults.length} submolts.`);
    
    toast({
      title: 'Daily inscription completed',
      description: `Successfully inscribed ${dailyResults.length} posts`,
      status: 'success',
      duration: 5000,
    });
    
    setIsRunning(false);
  };

  const calculateNextRun = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  };

  useEffect(() => {
    setNextRunTime(calculateNextRun());
    
    // Set up interval to check for 00:00 UTC
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0 && !isRunning) {
        executeDaily();
      }
      setNextRunTime(calculateNextRun());
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <>
      <HelmetSEO
        title="Moltbook Inscription Daily | 1btc.news"
        description="Daily Bitcoin inscription of top Moltbook posts"
      />
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={4}>
              Moltbook Inscription Daily
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Automated daily inscription of top posts from Moltbook submolts to Bitcoin
            </Text>
          </Box>

          <Alert status="info">
            <AlertIcon />
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">Automated Schedule</Text>
              <Text fontSize="sm">
                This process runs automatically every day at 00:00 UTC.
                {nextRunTime && (
                  <> Next run: {nextRunTime.toLocaleString()}</>
                )}
              </Text>
            </VStack>
          </Alert>

          <Box>
            <HStack mb={4}>
              <Heading as="h2" size="md">
                Target Submolts
              </Heading>
            </HStack>
            <HStack wrap="wrap" spacing={2}>
              {SUBMOLTS.map((submolt) => (
                <Badge key={submolt} variant="outline" colorScheme="blue">
                  {submolt}
                </Badge>
              ))}
            </HStack>
          </Box>

          <Box>
            <HStack mb={4} justify="space-between">
              <Heading as="h2" size="md">
                Manual Execution
              </Heading>
              <Button
                colorScheme="orange"
                onClick={executeDaily}
                isLoading={isRunning}
                loadingText="Processing..."
                disabled={isRunning}
              >
                Run Now
              </Button>
            </HStack>
            
            {isRunning && (
              <HStack mb={4}>
                <Spinner size="sm" />
                <Text>Processing submolts...</Text>
              </HStack>
            )}
          </Box>

          {results.length > 0 && (
            <Box>
              <Heading as="h3" size="md" mb={4}>
                Today's Results
              </Heading>
              <VStack spacing={4} align="stretch">
                {results.map((result, index) => (
                  <Box key={index} p={4} borderWidth={1} borderRadius="md">
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Badge colorScheme="green">{result.submolt}</Badge>
                        <Text fontSize="sm" color="gray.500">{result.date}</Text>
                      </HStack>
                      <Text fontWeight="bold">{result.post.title}</Text>
                      <Text fontSize="sm" noOfLines={2}>{result.post.content}</Text>
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Text fontSize="sm" fontWeight="medium">Tx ID:</Text>
                          <Code fontSize="xs">{result.txid}</Code>
                        </HStack>
                        {result.moltbookCommentUrl && (
                          <HStack>
                            <Text fontSize="sm" fontWeight="medium">Comment:</Text>
                            <Text fontSize="xs" color="blue.500">
                              {result.moltbookCommentUrl}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {logs.length > 0 && (
            <Box>
              <Heading as="h3" size="md" mb={4}>
                Execution Logs
              </Heading>
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                maxH="300px"
                overflowY="auto"
              >
                {logs.map((log, index) => (
                  <Text key={index} fontSize="xs" fontFamily="mono" mb={1}>
                    {log}
                  </Text>
                ))}
              </Box>
            </Box>
          )}

          <Alert status="warning">
            <AlertIcon />
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">Bounty Submission</Text>
              <Text fontSize="sm">
                To claim bounty rewards, comment on the GitHub issue with:
                <br />• Tx ID of the Bitcoin inscription
                <br />• Moltbook URL of your comment
                <br />• Pair claimed (e.g., "m/crypto for 2024-01-15")
                <br />• Your Stacks payout address
              </Text>
            </VStack>
          </Alert>
        </VStack>
      </Container>
      <Footer />
    </>
  );
}