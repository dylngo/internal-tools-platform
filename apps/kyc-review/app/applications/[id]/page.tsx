import { ResourceDetail } from '@platform/resource';
import { kycApplicationResource } from '@/resources/kyc-application';
import { kycApplicationActions } from '../resource-actions';

export default async function KycApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ResourceDetail resource={kycApplicationResource} actions={kycApplicationActions} id={id} />
  );
}
