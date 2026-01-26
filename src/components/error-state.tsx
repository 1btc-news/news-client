import { Link } from '@tanstack/react-router';

type ErrorStateProps = {
  icon?: string;
  title: string;
  message?: string;
  ctaText: string;
  ctaHref?: string;
  onRetry?: () => void;
};

export function ErrorState({
  icon = '!',
  title,
  message,
  ctaText,
  ctaHref,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="text-brand-orange text-6xl mb-4">{icon}</div>
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      {message && <p className="text-brand-gray mb-6">{message}</p>}
      {onRetry ? (
        <button onClick={onRetry} className="btn-primary">
          {ctaText}
        </button>
      ) : ctaHref ? (
        <Link to={ctaHref} className="btn-primary inline-block">
          {ctaText}
        </Link>
      ) : null}
    </div>
  );
}
