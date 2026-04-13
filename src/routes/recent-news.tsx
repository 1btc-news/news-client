import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Image,
  Modal,
  ModalOverlay,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { KVNamespaceListKey, KVNamespaceListResult } from '@cloudflare/workers-types';
import { InscriptionMeta, OrdinalNews } from '../../lib/api-types';
import { Link } from 'react-router-dom';
import Footer from '../components/footer';
import HelmetSeo from '../components/helmet-seo';
import SignupForm from '../components/signup-form';
import BitcoinIcon from '../components/bitcoin-icon';
import OneBtcIcon from '../components/1btc-icon';

const apiUrl = new URL('https://inscribe.news/');

async function getRecentNews() {
  const result = await fetch(new URL(`/api/data/ord-news`, apiUrl).toString());
  if (result.ok) {
    const infoData: KVNamespaceListResult<unknown, string> = await result.json();
    return infoData;
  }
  console.log(`getRecentNews: ${result.status} ${result.statusText}`);
  return undefined;
}

async function getNewsData(id: string) {
  const news = await fetch(new URL(`/api/data/${id}`, apiUrl).toString());
  if (news.ok) {
    const newsData: InscriptionMeta & OrdinalNews = await news.json();
    return newsData;
  }
  console.log(`getNewsData: ${news.status} ${news.statusText}`);
  return undefined;
}

function NewsItem(props: InscriptionMeta & OrdinalNews) {
  const oneBtcAuthors = ['1btc.news (@1btcnews)', '1btc.chat'];
  let verifiedAuthor = false;
  const { number, timestamp, title, author } = props;
  if (author && oneBtcAuthors.includes(author)) {
    verifiedAuthor = true;
  }
  return (
    <VStack
      alignItems="flex-start"
      w="100%"
      maxW={1200}
      py={4}
    >
      <Heading
        size="md"
        textAlign="left"
      >
        <Link
          className="link-wrap-hack"
          to={`/view-news?id=${number}`}
        >
          {title}
        </Link>
      </Heading>
      <HStack flexWrap="wrap">
        <Text as="b">{author ? author : 'anonymous'}</Text>
        {verifiedAuthor && <OneBtcIcon />}
        <Text>•</Text>
        <Text>
          {new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text>•</Text>
        <Text>Inscription # {number.toLocaleString()}</Text>
      </HStack>
      <Divider />
    </VStack>
  );
}

export default function RecentNews() {
  const [loading, setLoading] = useState(true);
  const [newsList, setNewsList] = useState<string[] | undefined>(undefined);
  const [newsData, setNewsData] = useState<(InscriptionMeta & OrdinalNews)[] | undefined>(
    undefined
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    getRecentNews()
      .then(data => {
        if (data) {
          const newsList = data.keys.map((key: KVNamespaceListKey<unknown, string>) => key.name);
          setNewsList(newsList);
        }
      })
      .catch(err => {
        console.log(`getRecentNews: ${err}`);
        setNewsList(undefined);
      });
  }, []);

  useEffect(() => {
    if (newsList && newsList.length > 0) {
      const processedNewsIds = new Set();
      for (const newsId of newsList) {
        if (!processedNewsIds.has(newsId)) {
          processedNewsIds.add(newsId);
          getNewsData(newsId)
            .then(data => {
              if (data) {
                setNewsData(prev => {
                  if (prev) {
                    return [...prev, data];
                  }
                  return [data];
                });
              }
              setLoading(false);
            })
            .catch(err => {
              console.log(`getNewsData: ${err}`);
              setLoading(false);
            });
        }
      }
    }
  }, [newsList]);

  if (loading) {
    return (
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
        <Image
          src="/logos/1btc-news-black.svg"
          boxSize="250px"
        />
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (!newsList || !newsData) {
    return (
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
        <Image
          src="/logos/1btc-news-black.svg"
          boxSize="250px"
        />
        <Text>Failed to load news.</Text>
      </Box>
    );
  }

  return (
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
      <HelmetSeo title="Recent News" />
      <Flex
        alignItems={['flex-start', 'center']}
        justifyContent="space-between"
        w="100%"
        maxW={1200}
        pb={6}
        direction={['column', 'row']}
        position="sticky"
        top={0}
        zIndex={10}
        bg="gray.900"
        pt={4}
      >
        <Flex
          alignItems="flex-start"
          w={['100%', 'auto']}
        >
          <Heading
            as="h1"
            size={['2xl', '3xl']}
            mb={[6, 0]}
          >
            1btc.news
          </Heading>
          <Badge ms={3}>raw feed</Badge>
        </Flex>
        <Button
          size={['md', 'md', 'lg']}
          onClick={onOpen}
          w={['100%', 'auto']}
          maxW="240px"
        >
          Join waitlist
        </Button>
      </Flex>
      {newsData
        .sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        })
        .map((news, i) => (
          <NewsItem
            key={i}
            {...news}
          />
        ))}
      <Footer />
      <Modal
        allowPinchZoom
        autoFocus
        onClose={onClose}
        isOpen={isOpen}
        size="xl"
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay
          bg="blackAlpha.200"
          backdropFilter="blur(2px)"
        />
        <ModalContent bgColor="var(--1btc-news-colors-brand-darkgray)">
          <ModalCloseButton />
          <ModalBody
            textAlign="center"
            pt={16}
            pb={12}
          >
            <Box
              mb={3}
              lineHeight={1}
            >
              <Text
                fontWeight="bold"
                fontSize={['2xl', '2xl', '4xl']}
                display={{ base: 'inline', sm: 'block' }}
              >
                Be first to access
              </Text>
              <Text
                fontWeight="bold"
                fontSize={['2xl', '2xl', '4xl']}
                display={{ base: 'inline', sm: 'block' }}
              >
                {' '}
                upcoming 1btc products
              </Text>
            </Box>
            <Text
              mb={6}
              fontSize={['sm', 'md', 'lg']}
            >
              By subscribing, you'll also get top news from the feed sent directly to your inbox,
              weekly.
            </Text>
            <SignupForm />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
