import { createFileRoute } from '@tanstack/react-router';
import { ErrorState } from '../components/error-state';

export const Route = createFileRoute('/$404')({
  component: () => (
    <ErrorState icon="404" title="Page not found" ctaText="Back to Home" ctaHref="/" />
  ),
});
