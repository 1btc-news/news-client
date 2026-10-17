import { useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  ButtonGroup,
  Code,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link as ChakraLink,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useControllableState,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import BitcoinIcon from '../components/bitcoin-icon';

// credit for the form template goes to:
// https://chakra-templates.dev/templates/forms/authentication/simpleSignupCard
export default function PostNews() {
  const [title, setTitle] = useControllableState({ defaultValue: '' });
  const [url, setUrl] = useControllableState({ defaultValue: '' });
  const [body, setBody] = useControllableState({ defaultValue: '' });
  const [author, setAuthor] = useControllableState({ defaultValue: '' });
  const [finalPost, setFinalPost] = useControllableState({ defaultValue: '' });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [feeRate, setFeeRate] = useState<number>(10);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);

  useEffect(() => {
    async function fetchRecommendedFees() {
      try {
        const feeRes = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (feeRes.ok) {
          const fees = await feeRes.json();
          if (fees && typeof fees.halfHourFee === 'number') {
            setFeeRate(fees.halfHourFee);
            return;
          }
        }
      } catch {
        // Fallback endpoint if mempool.space is unreachable
        try {
          const fallbackRes = await fetch('https://bitcoinsapi.com/api/v1/compat/mempool/fees/recommended');
          if (fallbackRes.ok) {
            const fallbackFees = await fallbackRes.json();
            if (fallbackFees && typeof fallbackFees.halfHourFee === 'number') {
              setFeeRate(fallbackFees.halfHourFee);
            }
          }
        } catch {
          // Default to 10 sat/vB
        }
      }

      try {
        const priceRes = await fetch('https://mempool.space/api/v1/prices');
        if (priceRes.ok) {
          const prices = await priceRes.json();
          if (prices && typeof prices.USD === 'number') {
            setBtcPrice(prices.USD);
          }
        }
      } catch {
        // Price display is optional
      }
    }
    fetchRecommendedFees();
  }, []);

  const copyText = () => {
    if (!finalPost || finalPost.length === 0) {
      toast({
        title: 'No data to copy',
        status: 'error',
        duration: 3000,
        isClosable: true,
        variant: 'left-accent',
      });
      return;
    }
    const copyStatus = copy(finalPost);
    if (copyStatus) {
      toast({
        title: `Copied ordinal news to clipboard`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        variant: 'left-accent',
      });
      return;
    }
    toast({
      title: `Unable to copy to clipboard`,
      status: 'error',
      duration: 3000,
      isClosable: true,
      variant: 'left-accent',
    });
  };

  const generatePost = () => {
    if (title.length === 0) {
      toast({
        title: 'Title is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
        variant: 'left-accent',
      });
      return;
    }

    if (url.length === 0 && body.length === 0) {
      toast({
        title: 'One of a URL or Body is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
        variant: 'left-accent',
      });
      return;
    }

    const postObject = {
      p: 'ons',
      op: 'post',
      title,
      ...(url.length > 0 && { url }),
      ...(author.length > 0 && { author }),
      ...(body.length > 0 && { body }),
    };

    setFinalPost(JSON.stringify(postObject, null, 2));

    onOpen();
  };

  // Cost calculation based on content size and current network fee rate
  const currentPostObject = {
    p: 'ons',
    op: 'post',
    title,
    ...(url.length > 0 && { url }),
    ...(author.length > 0 && { author }),
    ...(body.length > 0 && { body }),
  };
  const jsonString = JSON.stringify(currentPostObject);
  const contentBytes = title.length > 0 ? new TextEncoder().encode(jsonString).length : 0;
  const estimatedVBytes = contentBytes > 0 ? Math.ceil(contentBytes / 4) + 150 : 0;
  const estimatedSats = estimatedVBytes * feeRate;
  const estimatedUsd =
    btcPrice && estimatedSats > 0 ? ((estimatedSats / 100_000_000) * btcPrice).toFixed(2) : null;

  return (
    <>
      <Box
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        textAlign="left"
        w="100%"
        minH="100vh"
        py={8}
        px={4}
      >
        <Stack
          align={'center'}
          mb={8}
        >
          <Heading
            fontSize={'4xl'}
            textAlign={'center'}
          >
            Inscribe the News
          </Heading>
          <Text
            fontSize={'lg'}
            color={'gray.600'}
          >
            on Bitcoin, forever <BitcoinIcon />
          </Text>
        </Stack>
        <Box
          rounded={'3xl'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'dark-lg'}
          p={8}
          mb={8}
          mx="auto"
          w="100%"
          maxW="xl"
        >
          <Stack spacing={4}>
            <FormControl
              id="title"
              isRequired
            >
              <FormLabel fontSize={['sm', 'sm', 'xl']}>Title</FormLabel>
              <Input
                type="text"
                placeholder="The main headline"
                fontSize={['xs', 'sm', 'xl']}
                onChange={e => setTitle(e.target.value.trim())}
              />
            </FormControl>
            <FormControl id="url">
              <FormLabel fontSize={['sm', 'sm', 'xl']}>URL</FormLabel>
              <Input
                type="url"
                placeholder="Add a link (optional)"
                fontSize={['xs', 'sm', 'xl']}
                onChange={e => setUrl(e.target.value.trim())}
              />
            </FormControl>
            <FormControl id="author">
              <FormLabel fontSize={['sm', 'sm', 'xl']}>Author</FormLabel>
              <Input
                type="text"
                placeholder="Add an author (optional)"
                fontSize={['xs', 'sm', 'xl']}
                onChange={e => setAuthor(e.target.value.trim())}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize={['sm', 'sm', 'xl']}>Body</FormLabel>
              <Textarea
                resize="vertical"
                placeholder="Plain text or markdown (optional)"
                fontSize={['xs', 'sm', 'xl']}
                onChange={e => setBody(e.target.value.trim())}
              />
            </FormControl>

            {contentBytes > 0 && (
              <Box
                p={4}
                bg={useColorModeValue('orange.50', 'gray.800')}
                border="1px"
                borderColor={useColorModeValue('orange.200', 'orange.700')}
                borderRadius="xl"
                fontSize="sm"
              >
                <Text fontWeight="semibold" color={useColorModeValue('orange.800', 'orange.200')}>
                  Estimated cost: ~{estimatedSats.toLocaleString()} sats
                  {estimatedUsd ? ` ($${estimatedUsd})` : ''}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Based on: {contentBytes} bytes (~{estimatedVBytes} vB) @ {feeRate} sat/vB
                </Text>
              </Box>
            )}

            <Stack
              spacing={10}
              pt={2}
            >
              <Button
                loadingText="Submitting"
                size="lg"
                onClick={generatePost}
                borderRadius="xl"
              >
                Generate
              </Button>
            </Stack>
          </Stack>
        </Box>
        <Link to="/">Back Home</Link>
      </Box>
      <Box w="100%">
        <Modal
          allowPinchZoom
          autoFocus
          onClose={onClose}
          isOpen={isOpen}
          size={['full', 'full', 'xl']}
          scrollBehavior="inside"
          closeOnOverlayClick={false}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <Heading>Ready to Inscribe</Heading>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody
              display="flex"
              flexDir="column"
            >
              <Code
                display="block"
                whiteSpace="pre-wrap"
                px={2}
                mb={6}
                children={finalPost}
              ></Code>

              {estimatedSats > 0 && (
                <Box
                  p={3}
                  mb={4}
                  bg={useColorModeValue('orange.50', 'gray.800')}
                  borderRadius="xl"
                  border="1px"
                  borderColor={useColorModeValue('orange.200', 'orange.700')}
                >
                  <Text fontSize="sm" fontWeight="semibold">
                    Estimated Inscription Cost: ~{estimatedSats.toLocaleString()} sats
                    {estimatedUsd ? ` ($${estimatedUsd})` : ''}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Calculated for {contentBytes} bytes at recommended feerate of {feeRate} sat/vB.
                  </Text>
                </Box>
              )}

              <Box
                display="flex"
                flexDir={['column-reverse', 'row']}
                alignContent="center"
                alignItems="space-between"
                justifyContent="space-between"
                mb={6}
              >
                <Text>
                  You can upload an inscription using ord or through a service that supports text
                  inscriptions.
                </Text>
                <Button
                  mx={3}
                  mb={[6, 0]}
                  whiteSpace="nowrap"
                  onClick={copyText}
                  minW="fit-content"
                  borderRadius="xl"
                >
                  Copy to Clipboard
                </Button>
              </Box>
              <Alert
                status="warning"
                flexShrink={0}
              >
                <AlertIcon />
                <AlertDescription>
                  Remember,{' '}
                  <Text
                    as="b"
                    title="Do Your Own Research"
                  >
                    always DYOR
                  </Text>{' '}
                  before using a tool or service!
                </AlertDescription>
              </Alert>
              <ButtonGroup
                spacing={[0, 0, 6]}
                my={6}
                flexDir={['column', 'column', 'row']}
                alignItems="center"
                justifyContent="center"
              >
                <Button
                  borderRadius="xl"
                  as={ChakraLink}
                  href="https://gamma.io/ordinals"
                  isExternal
                  className="link-button"
                  minW={['100%', '75%', 'fit-content']}
                  mb={[6, 6, 0]}
                >
                  Gamma
                </Button>
                <Button
                  borderRadius="xl"
                  as={ChakraLink}
                  href="https://ordinalsbot.com/"
                  isExternal
                  className="link-button"
                  minW={['100%', '75%', 'fit-content']}
                  mb={[6, 6, 0]}
                >
                  OrdinalsBot
                </Button>
                <Button
                  borderRadius="xl"
                  as={ChakraLink}
                  href="https://ordimint.com"
                  isExternal
                  className="link-button"
                  minW={['100%', '75%', 'fit-content']}
                  mb={[6, 6, 0]}
                >
                  Ordimint
                </Button>
                <Button
                  borderRadius="xl"
                  as={ChakraLink}
                  href="https://unisat.io/inscribe"
                  isExternal
                  className="link-button"
                  minW={['100%', '75%', 'fit-content']}
                >
                  UniSat
                </Button>
              </ButtonGroup>
              <Text mb={6}>
                Use the "plain text" inscription type if you're using a service, or make sure the
                file's type is `.txt` if using the Ordinals CLI.
              </Text>
              <Text>
                See the{' '}
                <ChakraLink
                  href="https://github.com/neu-fi/awesome-ordinals"
                  isExternal
                >
                  Ordinals Awesome List
                </ChakraLink>{' '}
                for even more inscription services.{' '}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                mr={3}
                onClick={onClose}
                size="md"
                borderRadius="xl"
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}
