import { ResourceList } from '@platform/resource';
import type { SearchParams } from '@platform/ui';
import { kycApplicationResource } from '@/resources/kyc-application';

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <ResourceList resource={kycApplicationResource} searchParams={await searchParams} />;
}
