import type { ResourceActions } from '@platform/resource';
import {
  approveCustomerRequest,
  createCustomer,
  rejectCustomerRequest,
  revealCustomerField,
  runCustomerAction,
  updateCustomer,
} from './actions';

/** The server actions bundled in the shape the generated pages expect. */
export const customerActions: ResourceActions = {
  create: createCustomer,
  update: updateCustomer,
  run: runCustomerAction,
  approve: approveCustomerRequest,
  reject: rejectCustomerRequest,
  reveal: revealCustomerField,
};
