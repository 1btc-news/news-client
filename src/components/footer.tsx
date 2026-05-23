import { Link as ChakraLink, VStack, Text, Stack, Divider } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import BitcoinIcon from './bitcoin-icon';

export default function Footer() {
  const location = useLocation();

  return (
    <VStack
      fontWeight={900}
      alignItems="center"
      textAlign="center"
      width="100%"
      maxW="1200px"
      pt={6}
    >
      <Divider mb={2} />
      <Text fontSize="sm" fontWeight="bold">
        News on the ledger of record. <BitcoinIcon color="#F7931A"></BitcoinIcon>
      </Text>
      <Stack direction={['column', 'column', 'row']} align="center">
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
        <Divider orientation="vertical" hideBelow="sm" />
        <ChakraLink
          isExternal
          href="https://github.com/1btc-news/news-client"
        >
          GitHub
        </ChakraLink>
      </Stack>
    </VStack>
  );
}
