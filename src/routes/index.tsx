import { Link, createFileRoute } from '@tanstack/react-router';
import type { NewsItem, NewsListResponse, NewsDataResponse } from '../lib/api-types';
import { API_BASE } from '../lib/constants';
import { formatDate, truncate } from '../lib/utils';
import { AuthorDisplay } from '../components/author-display';
import { ErrorState } from '../components/error-state';
import { NewsListSkeleton } from '../components/loading-skeleton';

const ITEMS_PER_PAGE = 20;

export const Route = createFileRoute('/')({
  loader: async () => {
    // Fetch list of news metadata
    const listResponse = await fetch(`${API_BASE}/data/ord-news`);
    if (!listResponse.ok) {
      throw new Error('Failed to fetch news list');
    }
    const listData: NewsListResponse = await listResponse.json();

    // Take the most recent items (list is ordered by inscription number, newest at end)
    const recentKeys = listData.keys.slice(-ITEMS_PER_PAGE).reverse();

    // Fetch full content for each item in parallel
    const items = await Promise.all(
      recentKeys.map(async (key) => {
        try {
          const response = await fetch(`${API_BASE}/data/${key.metadata.id}`);
          if (!response.ok) return null;
          const text = await response.text();
          // Handle non-JSON responses (e.g., Cloudflare errors)
          if (!text.startsWith('{')) return null;
          const data: NewsDataResponse = JSON.parse(text);
          // Transform flat response to NewsItem format
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
          } as NewsItem;
        } catch {
          return null;
        }
      })
    );

    return { items: items.filter((item): item is NewsItem => item !== null) };
  },

  pendingComponent: NewsListSkeleton,
  errorComponent: ({ error }) => (
    <ErrorState
      title="Failed to load news"
      message={error.message}
      ctaText="Try Again"
      onRetry={() => window.location.reload()}
    />
  ),
  component: HomePage,
});

function HomePage() {
  const { items } = Route.useLoaderData();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recent News</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-brand-gray mb-4">No news inscriptions found.</p>
          <Link to="/post" className="btn-primary inline-block">
            Be the first to post
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <NewsCard key={item.meta.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const { meta, news } = item;

  return (
    <article className="border border-brand-darkgray rounded-lg p-6 hover:border-brand-orange/50 transition-colors">
      <Link to="/article/$id" params={{ id: meta.id }} className="block group">
        <h2 className="text-xl font-bold text-white group-hover:text-brand-orange transition-colors mb-2">
          {news.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-gray">
          {news.author && <AuthorDisplay author={news.author} />}
          <span>{formatDate(meta.timestamp)}</span>
          {meta.news_number && (
            <span className="text-brand-orange">#{meta.news_number}</span>
          )}
        </div>
        {news.body && (
          <p className="mt-3 text-gray-400 line-clamp-2">{truncate(news.body, 200)}</p>
        )}
      </Link>
    </article>
  );
}
