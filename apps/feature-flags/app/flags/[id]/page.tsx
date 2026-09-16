import { ResourceDetail } from '@platform/resource';
import { featureFlagResource } from '@/resources/feature-flag';
import { featureFlagActions } from '../resource-actions';

export default async function FeatureFlagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceDetail resource={featureFlagResource} actions={featureFlagActions} id={id} />;
}
