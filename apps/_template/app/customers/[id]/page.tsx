import { ResourceDetail } from '@platform/resource';
import { customerResource } from '@/resources/customer';
import { customerActions } from '../resource-actions';

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceDetail resource={customerResource} actions={customerActions} id={id} />;
}
