import { ResourceList } from '@platform/resource';
import { featureFlagResource } from '@/resources/feature-flag';

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ResourceList resource={featureFlagResource} searchParams={await searchParams} />;
}
