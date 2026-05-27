import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  ButtonGroup,
  Code,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Image,
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
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import BitcoinIcon from '../components/bitcoin-icon';
import { OrdinalNews } from '../../lib/api-types';

type OrdinalsBotOrder = {
  status?: string;
  error?: string;
  reason?: string;
  id?: string;
  orderId?: string;
  charge?: {
    id?: string;
    address?: string;
    amount?: number;
    lightning_invoice?: {
      payreq?: string;
      expires_at?: number;
    };
  };
  paid?: boolean;
  underpaid?: boolean;
  expired?: boolean;
  chainFee?: number;
  serviceFee?: number;
  tx?: {
    inscription?: string;
    reveal?: string;
    commit?: string;
  };
  sent?: string;
};

const ORDINALSBOT_API_ROOT = 'https://api2.ordinalsbot.com';

function encodeBase64Json(payload: OrdinalNews) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function getOrderId(order?: OrdinalsBotOrder) {
  return order?.id || order?.orderId || order?.charge?.id;
}

function getPaymentText(order?: OrdinalsBotOrder) {
  const lightningInvoice = order?.charge?.lightning_invoice?.payreq;
  if (lightningInvoice) return lightningInvoice;
  if (order?.charge?.address && order.charge.amount) {
    return `bitcoin:${order.charge.address}?amount=${order.charge.amount / 100_000_000}`;
  }
  return order?.charge?.address || '';
}

async function createOrdinalsBotOrder(payload: OrdinalNews, receiveAddress: string) {
  const encodedPayload = encodeBase64Json(payload);
  const response = await fetch(`${ORDINALSBOT_API_ROOT}/order`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiveAddress,
      fee: 10,
      files: [
        {
          name: 'news.json',
          size: encodedPayload.length,
          dataURL: `data:application/json;base64,${encodedPayload}`,
        },
      ],
    }),
  });

  const order: OrdinalsBotOrder = await response.json();
  if (!response.ok || order.status === 'error') {
    throw new Error(order.error || order.reason || 'Unable to create inscription order');
  }
  return order;
}

async function getOrdinalsBotOrder(orderId: string) {
  const response = await fetch(`${ORDINALSBOT_API_ROOT}/order?id=${encodeURIComponent(orderId)}`, {
    headers: { Accept: 'application/json' },
  });
  const order: OrdinalsBotOrder = await response.json();
  if (!response.ok || order.status === 'error') {
    throw new Error(order.error || order.reason || 'Unable to load inscription order');
  }
  return order;
}

// credit for the form template goes to:
// https://chakra-templates.dev/templates/forms/authentication/simpleSignupCard
export default function PostNews() {
  const navigate = useNavigate();
  const [title, setTitle] = useControllableState({ defaultValue: '' });
  const [url, setUrl] = useControllableState({ defaultValue: '' });
  const [body, setBody] = useControllableState({ defaultValue: '' });
  const [author, setAuthor] = useControllableState({ defaultValue: '' });
  const [receiveAddress, setReceiveAddress] = useControllableState({ defaultValue: '' });
  const [finalPost, setFinalPost] = useControllableState({ defaultValue: '' });
  const [onsPayload, setOnsPayload] = useControllableState<OrdinalNews | undefined>({
    defaultValue: undefined,
  });
  const [ordinalsBotOrder, setOrdinalsBotOrder] = useControllableState<
    OrdinalsBotOrder | undefined
  >({ defaultValue: undefined });
  const [isCreatingOrder, setIsCreatingOrder] = useControllableState({ defaultValue: false });
  const [isPollingOrder, setIsPollingOrder] = useControllableState({ defaultValue: false });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

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

    const postObject: OrdinalNews = {
      p: 'ons',
      op: 'post',
      title,
      ...(url.length > 0 && { url }),
      ...(author.length > 0 && { author }),
      ...(body.length > 0 && { body }),
    };

    setOnsPayload(postObject);
    setFinalPost(JSON.stringify(postObject, null, 2));

    onOpen();
  };

  const createInscriptionOrder = async () => {
    if (!onsPayload) return;
    if (receiveAddress.length === 0) {
      toast({
        title: 'Receiving address is required',
        description: 'Enter the Bitcoin address that should receive the finished inscription.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        variant: 'left-accent',
      });
      return;
    }

    setIsCreatingOrder(true);
    try {
      const order = await createOrdinalsBotOrder(onsPayload, receiveAddress);
      setOrdinalsBotOrder(order);
      toast({
        title: 'Inscription order created',
        description: 'Pay with Bitcoin or Lightning, then this page will watch for completion.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        variant: 'left-accent',
      });
    } catch (error) {
      toast({
        title: 'Unable to create inscription order',
        description: error instanceof Error ? error.message : 'OrdinalsBot rejected the order.',
        status: 'error',
        duration: 6000,
        isClosable: true,
        variant: 'left-accent',
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const refreshInscriptionOrder = async () => {
    const orderId = getOrderId(ordinalsBotOrder);
    if (!orderId) return;

    setIsPollingOrder(true);
    try {
      const order = await getOrdinalsBotOrder(orderId);
      setOrdinalsBotOrder(order);
      if (order.tx?.inscription) {
        navigate(`/view-news?id=${order.tx.inscription}`);
      }
    } catch (error) {
      toast({
        title: 'Unable to refresh inscription order',
        description: error instanceof Error ? error.message : 'Try again in a moment.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        variant: 'left-accent',
      });
    } finally {
      setIsPollingOrder(false);
    }
  };

  const paymentText = getPaymentText(ordinalsBotOrder);
  const orderId = getOrderId(ordinalsBotOrder);

  useEffect(() => {
    if (!orderId || ordinalsBotOrder?.tx?.inscription || ordinalsBotOrder?.expired) return;

    const interval = window.setInterval(() => {
      refreshInscriptionOrder();
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [orderId, ordinalsBotOrder?.tx?.inscription, ordinalsBotOrder?.expired]);

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
            <FormControl id="receive-address">
              <FormLabel fontSize={['sm', 'sm', 'xl']}>Receive inscription address</FormLabel>
              <Input
                type="text"
                placeholder="Taproot or Ordinals-compatible Bitcoin address"
                fontSize={['xs', 'sm', 'xl']}
                onChange={e => setReceiveAddress(e.target.value.trim())}
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
              <Button
                mb={6}
                size="lg"
                onClick={createInscriptionOrder}
                isLoading={isCreatingOrder}
                loadingText="Creating order"
                borderRadius="xl"
              >
                Inscribe with OrdinalsBot
              </Button>
              {ordinalsBotOrder && (
                <Box
                  borderWidth="1px"
                  borderRadius="xl"
                  p={4}
                  mb={6}
                >
                  <Heading
                    size="md"
                    mb={3}
                  >
                    Payment
                  </Heading>
                  {paymentText && (
                    <Image
                      alt="Payment QR code"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        paymentText
                      )}`}
                      boxSize="220px"
                      mb={4}
                    />
                  )}
                  {ordinalsBotOrder.charge?.amount && (
                    <Text>
                      Amount: <b>{ordinalsBotOrder.charge.amount.toLocaleString()} sats</b>
                    </Text>
                  )}
                  {ordinalsBotOrder.charge?.address && (
                    <Text
                      wordBreak="break-all"
                      mt={2}
                    >
                      Bitcoin address: <Code>{ordinalsBotOrder.charge.address}</Code>
                    </Text>
                  )}
                  {ordinalsBotOrder.charge?.lightning_invoice?.payreq && (
                    <Text
                      wordBreak="break-all"
                      mt={2}
                    >
                      Lightning invoice:{' '}
                      <Code>{ordinalsBotOrder.charge.lightning_invoice.payreq}</Code>
                    </Text>
                  )}
                  <Text mt={2}>
                    Status:{' '}
                    <b>
                      {ordinalsBotOrder.expired
                        ? 'expired'
                        : ordinalsBotOrder.paid
                          ? 'paid'
                          : ordinalsBotOrder.underpaid
                            ? 'underpaid'
                            : 'waiting for payment'}
                    </b>
                  </Text>
                  {ordinalsBotOrder.tx?.inscription && (
                    <Text
                      wordBreak="break-all"
                      mt={2}
                    >
                      Inscription: <Code>{ordinalsBotOrder.tx.inscription}</Code>
                    </Text>
                  )}
                  <ButtonGroup
                    mt={4}
                    spacing={3}
                  >
                    <Button
                      onClick={refreshInscriptionOrder}
                      isLoading={isPollingOrder}
                      loadingText="Checking"
                      borderRadius="xl"
                    >
                      Check Status
                    </Button>
                    {paymentText && (
                      <Button
                        onClick={() => copy(paymentText)}
                        borderRadius="xl"
                      >
                        Copy Payment
                      </Button>
                    )}
                  </ButtonGroup>
                </Box>
              )}
              <Divider mb={6} />
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
