import { ResourceDetail } from '@platform/resource';
import { refundResource } from '@/resources/refund';
import { refundActions } from '../resource-actions';

export default async function RefundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceDetail resource={refundResource} actions={refundActions} id={id} />;
}
