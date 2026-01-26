import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '1btc.news - Bitcoin Ordinal News' },
      { name: 'description', content: 'News inscribed on Bitcoin ordinals' },
      { name: 'theme-color', content: '#1A1919' },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: '1btc.news' },
      { property: 'og:title', content: '1btc.news - Bitcoin Ordinal News' },
      { property: 'og:description', content: 'News inscribed on Bitcoin ordinals' },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: '1btc.news - Bitcoin Ordinal News' },
      { name: 'twitter:description', content: 'News inscribed on Bitcoin ordinals' },
    ],
    links: [
      // Preload critical fonts
      { rel: 'preload', href: '/fonts/ReallySansLarge-Bold.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: '/fonts/ReallySansSmall-Regular.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-icon.png' },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-brand-dark">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="border-b border-brand-darkgray">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/logos/1btc-news-orange.svg" alt="1btc.news" width={40} height={40} className="h-10 w-auto" />
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-gray-300 hover:text-white transition-colors">
            News
          </Link>
          <Link to="/post" className="text-gray-300 hover:text-white transition-colors">
            Post
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-brand-darkgray mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 text-center text-brand-gray text-sm">
        <p>
          News inscribed on{' '}
          <a
            href="https://ordinals.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:text-bitcoin-orange"
          >
            Bitcoin ordinals
          </a>
        </p>
        <p className="mt-2">
          Built with the{' '}
          <a
            href="https://inscribe.news"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:text-bitcoin-orange"
          >
            Ordinal News Standard
          </a>
        </p>
      </div>
    </footer>
  );
}
