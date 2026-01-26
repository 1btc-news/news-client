import { isVerifiedAuthor } from '../lib/utils';
import { VerifiedBadge } from './verified-badge';

type AuthorDisplayProps = {
  author: string;
};

export function AuthorDisplay({ author }: AuthorDisplayProps) {
  const verified = isVerifiedAuthor(author);
  return (
    <span className="flex items-center gap-1.5">
      By <span className="text-white">{author}</span>
      {verified && <VerifiedBadge />}
    </span>
  );
}
