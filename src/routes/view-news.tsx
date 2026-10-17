import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Divider,
  Heading,
  HStack,
  Image,
  Link as ChakraLink,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from '../components/footer';
import { InscriptionMeta, OrdinalNews } from '../../lib/api-types';
import { countWordsAndEstimateReadingTime } from '../helpers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ChakraUIRenderer from 'chakra-ui-markdown-renderer';
import HelmetSeo from '../components/helmet-seo';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

async function getInscriptionData(
  id: string
): Promise<(InscriptionMeta & OrdinalNews) | undefined> {
  const url = new URL('https://inscribe.news/');
  const info = await fetch(new URL(`/api/info/${id}`, url).toString());
  const content = await fetch(new URL(`/api/content/${id}`, url).toString());
  if (info.ok && content.ok) {
    const infoData = await info.json();
    const contentData = await content.json();
    return {
      ...infoData,
      ...contentData,
    };
  }
  console.log(`getInscriptionData err: ${info.status} ${content.status}`);
  return undefined;
}

interface NewsStats {
  wordCount: number;
  readingTime: number;
}

export default function ViewNews() {
  const query = useQuery();
  const id = query.get('id');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<(InscriptionMeta & OrdinalNews) | undefined>(undefined);
  const [news, setNews] = useState<OrdinalNews | undefined>(undefined);
  const [stats, setStats] = useState<NewsStats | undefined>(undefined);
  const toast = useToast();

  useEffect(() => {
    if (id) {
      getInscriptionData(id).then(data => {
        setLoading(false);
        if (data === undefined) return;
        setData(data);
        // extract news values as InscriptionMeta
        const { p, op, title, url, body, author, authorAddress, signature } = data;
        if (p === 'ons' && title) {
          setNews({
            p,
            op,
            title,
            url,
            body,
            author,
            authorAddress,
            signature,
          });
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (news && news.body) {
      setStats(countWordsAndEstimateReadingTime(news.body));
    }
  }, [news]);

  const copyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Link copied to clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
        variant: 'left-accent',
      });
    }).catch(() => {
      toast({
        title: 'Unable to copy link',
        status: 'error',
        duration: 3000,
        isClosable: true,
        variant: 'left-accent',
      });
    });
  };

  const handleNativeShare = () => {
    if (navigator.share && news) {
      navigator.share({
        title: news.title,
        url: window.location.href,
      }).catch(() => {
        // User cancelled or share failed
      });
    } else {
      copyShareLink();
    }
  };

  if (!id) {
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
        <HelmetSeo
          title="No Inscription ID"
          description="Unable to load news inscription."
        />
        <Image
          src="/logos/1btc-news-black.svg"
          boxSize="250px"
        />
        <Heading>No Inscription ID</Heading>
        <Text>Unable to load news inscription.</Text>
        <Text>Please provide the ID as a query parameter, or</Text>
        <Link to="/">Click this link to return home.</Link>
      </Box>
    );
  }

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
        <Heading>Loading inscription data...</Heading>
        <Text>ID: {id}</Text>
      </Box>
    );
  }

  if (!data || !news) {
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
        <Heading>Unable to Load</Heading>
        <Text>Unable to load news inscription.</Text>
        <Text>ID: {id}</Text>
        <Link to="/">Click this link to return home.</Link>
      </Box>
    );
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(news.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`;

  return (
    <Container
      display="flex"
      flexDir="column"
      textAlign="left"
      minH="100vh"
      maxW="800px"
      py={8}
      px={4}
    >
      <HelmetSeo
        title={news.title}
        description={news.body}
        url={news.url}
      />
      <Heading
        as="h1"
        lineHeight={1}
        pb={3}
        className="ord-news-title"
        size="2xl"
      >
        {news.url ? (
          <ChakraLink
            href={news.url}
            isExternal
          >
            {news.title}
          </ChakraLink>
        ) : (
          news.title
        )}
      </Heading>
      <HStack
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Text color="gray.600">
          {news.author && <Text as="b">{`${news.author} • `}</Text>}
          {new Date(data.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {stats &&
            ` • ${stats.wordCount.toLocaleString()} words • ${stats.readingTime.toLocaleString()} min read`}
        </Text>
        <ButtonGroup size="sm" variant="outline" spacing={2}>
          <Button onClick={copyShareLink} borderRadius="lg">
            🔗 Copy Link
          </Button>
          <Button onClick={handleNativeShare} borderRadius="lg">
            📤 Share
          </Button>
          <Button
            as={ChakraLink}
            href={tweetUrl}
            isExternal
            borderRadius="lg"
            _hover={{ textDecoration: 'none' }}
          >
            Post to 𝕏
          </Button>
        </ButtonGroup>
      </HStack>
      {news.body && (
        <>
          <Divider
            orientation="horizontal"
            my={3}
            style={{ background: 'var(--1btc-news-colors-whiteAlpha-300)' }}
          />
          <ReactMarkdown
            components={ChakraUIRenderer()}
            children={news.body}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            linkTarget="_blank"
            className="ord-news-body"
          ></ReactMarkdown>
        </>
      )}
      <Divider mb={3} />
      <Footer />
    </Container>
  );
}
