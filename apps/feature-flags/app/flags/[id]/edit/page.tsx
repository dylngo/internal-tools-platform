import { ResourceEdit } from '@platform/resource';
import { featureFlagResource } from '@/resources/feature-flag';
import { featureFlagActions } from '../../resource-actions';

export default async function EditFeatureFlagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceEdit resource={featureFlagResource} actions={featureFlagActions} id={id} />;
}
