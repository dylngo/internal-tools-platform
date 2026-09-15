import { buttonClassName, EmptyState } from '@platform/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <EmptyState>
      <p className="mb-4">That record does not exist.</p>
      <Link href="/" className={buttonClassName('outline', 'sm')}>
        Go home
      </Link>
    </EmptyState>
  );
}
