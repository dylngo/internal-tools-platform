import { ResourceList } from '@platform/resource';
import type { SearchParams } from '@platform/ui';
import { customerResource } from '@/resources/customer';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <ResourceList resource={customerResource} searchParams={await searchParams} />;
}
