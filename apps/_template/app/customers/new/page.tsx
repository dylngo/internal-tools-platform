import { ResourceNew } from '@platform/resource';
import { customerResource } from '@/resources/customer';
import { customerActions } from '../resource-actions';

export default function NewCustomerPage() {
  return <ResourceNew resource={customerResource} actions={customerActions} />;
}
