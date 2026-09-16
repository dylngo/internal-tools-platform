import { ResourceList } from '@platform/resource';
import type { SearchParams } from '@platform/ui';
import { refundResource } from '@/resources/refund';

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <ResourceList resource={refundResource} searchParams={await searchParams} />;
}
