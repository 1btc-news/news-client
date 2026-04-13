import { Link as ChakraLink, VStack, Heading, Stack, Divider, HStack, Text } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import BitcoinIcon from './bitcoin-icon';

export default function Footer() {
  const location = useLocation();

  return (
    <VStack
      fontWeight={900}
      alignItems="start"
      width="100%"
      maxW="1200px"
      spacing={4}
    >
      <Heading pt={6}>
        News on the ledger of record. <BitcoinIcon color="#F7931A"></BitcoinIcon>
      </Heading>
      <Stack direction={['column', 'column', 'row']} spacing={4} alignItems="center">
        {location.pathname !== '/' && (
          <>
            <Link to="/">Home</Link>
            <Divider
              orientation="vertical"
              hideBelow="sm"
            />
          </>
        )}
        <ChakraLink
          isExternal
          href="https://inscribe.news"
        >
          Inscribe News
        </ChakraLink>
        <Divider
          orientation="vertical"
          hideBelow="sm"
        />
        <ChakraLink
          isExternal
          href="https://github.com/1btc-news/news-client"
        >
          GitHub
        </ChakraLink>
      </Stack>
      <Text fontSize="sm" color="gray.500" pb={4}>
        &copy; {new Date().getFullYear()} 1btc.news &mdash; Built on Bitcoin
      </Text>
    </VStack>
  );
}
