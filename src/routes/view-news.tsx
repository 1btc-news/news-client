import {
  Box,
  Container,
  Divider,
  Heading,
  Image,
  Link as ChakraLink,
  Text,
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
async function getInscriptionData(id: string): Promise<(InscriptionMeta & OrdinalNews) | undefined> {
  if (!id) {
    throw new Error('ID is required');
  }
  const url = new URL('https://inscribe.news/');
  try {
    const infoResponse = await fetch(new URL(`/api/info/${id}`, url).toString());
    if (!infoResponse.ok) {
      throw new Error(`Failed to fetch info: ${infoResponse.status}`);
    }
    const contentResponse = await fetch(new URL(`/api/content/${id}`, url).toString());
    if (!contentResponse.ok) {
      throw new Error(`Failed to fetch content: ${contentResponse.status}`);
    }
    const infoData = await infoResponse.json();
    const contentData = await contentResponse.json();
    if (!infoData || !contentData) {
      throw new Error('Invalid API response');
    }
    return {
      ...infoData,
      ...contentData,
    };
  } catch (error) {
    console.error(`getInscriptionData error: ${error.message}`);
    return undefined;
  }
}
  const id = query.get('id');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<(InscriptionMeta & OrdinalNews) | undefined>(undefined);
  const [news, setNews] = useState<OrdinalNews | undefined>(undefined);
  const [stats, setStats] = useState<NewsStats | undefined>(undefined);

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
      <Text>
        {news.author && <Text as="b">{`${news.author} • `}</Text>}
        {new Date(data.timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        {stats &&
          ` • ${stats.wordCount.toLocaleString()} words • ${stats.readingTime.toLocaleString()} min read`}
      </Text>
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
