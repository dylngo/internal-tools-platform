import { ResourceEdit } from '@platform/resource';
import { customerResource } from '@/resources/customer';
import { customerActions } from '../../resource-actions';

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceEdit resource={customerResource} actions={customerActions} id={id} />;
}
