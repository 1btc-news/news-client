import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useState, useEffect } from 'react';
import type { NewsItem, NewsDataResponse } from '../lib/api-types';
import { API_BASE } from '../lib/constants';
import { formatDate, getReadingTime, getMetaDescription } from '../lib/utils';
import { AuthorDisplay } from '../components/author-display';
import { ErrorState } from '../components/error-state';
import { ArticleSkeleton } from '../components/loading-skeleton';

// Lazy load markdown rendering (~73KB savings)
const ReactMarkdown = lazy(() => import('react-markdown'));

// Transform flat API response to NewsItem format
function transformResponse(data: NewsDataResponse): NewsItem {
  return {
    meta: {
      id: data.id,
      number: data.number,
      address: data.address,
      content_type: data.content_type,
      content_length: data.content_length,
      genesis_block_height: data.genesis_block_height,
      genesis_tx_id: data.genesis_tx_id,
      timestamp: data.timestamp,
      last_updated: data.last_updated,
    },
    news: {
      p: data.p,
      op: data.op,
      title: data.title,
      url: data.url,
      body: data.body,
      author: data.author,
    },
  };
}

export const Route = createFileRoute('/article/$id')({
  loader: async ({ params }) => {
    const response = await fetch(`${API_BASE}/data/${params.id}`);
    if (!response.ok) {
      throw new Error('Article not found');
    }
    const text = await response.text();
    // Handle non-JSON responses (e.g., Cloudflare errors)
    if (!text.startsWith('{')) {
      throw new Error('Article not found');
    }
    const data: NewsDataResponse = JSON.parse(text);
    return transformResponse(data);
  },

  head: ({ loaderData }) => {
    const { news, meta } = loaderData;
    const title = `${news.title} | 1btc.news`;
    const description = getMetaDescription(news.body, 'News inscribed on Bitcoin ordinals');

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        // Open Graph
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: news.title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: `https://1btc.news/article/${meta.id}` },
        { property: 'og:site_name', content: '1btc.news' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: news.title },
        { name: 'twitter:description', content: description },
        // Article metadata
        ...(news.author ? [{ property: 'article:author', content: news.author }] : []),
        { property: 'article:published_time', content: meta.timestamp },
      ],
    };
  },

  pendingComponent: ArticleSkeleton,
  errorComponent: ({ error }) => (
    <ErrorState
      icon="404"
      title="Article not found"
      message={error.message}
      ctaText="Back to Home"
      ctaHref="/"
    />
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { news, meta } = Route.useLoaderData();
  const readingTime = news.body ? getReadingTime(news.body) : 0;

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{news.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-brand-gray text-sm">
          {news.author && <AuthorDisplay author={news.author} />}
          <span>{formatDate(meta.timestamp)}</span>
          {meta.news_number && <span className="text-brand-orange">#{meta.news_number}</span>}
          {readingTime > 0 && <span>{readingTime} min read</span>}
        </div>
      </header>

      {news.body && <MarkdownBody content={news.body} />}

      {news.url && (
        <div className="mt-8 pt-8 border-t border-brand-darkgray">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-bitcoin-orange"
          >
            Read original source
            <ExternalLinkIcon />
          </a>
        </div>
      )}

      <footer className="mt-8 pt-8 border-t border-brand-darkgray">
        <div className="text-sm text-brand-gray space-y-2">
          <p>
            <span className="text-gray-500">Inscription ID:</span>{' '}
            <a
              href={`https://ordinals.com/inscription/${meta.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs break-all"
            >
              {meta.id}
            </a>
          </p>
          {meta.genesis_tx_id && (
            <p>
              <span className="text-gray-500">Genesis TX:</span>{' '}
              <a
                href={`https://mempool.space/tx/${meta.genesis_tx_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs break-all"
              >
                {meta.genesis_tx_id}
              </a>
            </p>
          )}
        </div>
      </footer>
    </article>
  );
}

function MarkdownBody({ content }: { content: string }) {
  return (
    <Suspense fallback={<div className="prose-news animate-pulse">Loading content...</div>}>
      <MarkdownRenderer content={content} />
    </Suspense>
  );
}

type MarkdownPlugins = {
  remarkGfm: typeof import('remark-gfm').default;
  rehypeRaw: typeof import('rehype-raw').default;
};

function MarkdownRenderer({ content }: { content: string }) {
  const [plugins, setPlugins] = useState<MarkdownPlugins | null>(null);

  useEffect(() => {
    Promise.all([import('remark-gfm'), import('rehype-raw')]).then(([gfm, raw]) => {
      setPlugins({ remarkGfm: gfm.default, rehypeRaw: raw.default });
    });
  }, []);

  if (!plugins) {
    return <div className="prose-news">Loading...</div>;
  }

  return (
    <div className="prose-news">
      <ReactMarkdown remarkPlugins={[plugins.remarkGfm]} rehypePlugins={[plugins.rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
