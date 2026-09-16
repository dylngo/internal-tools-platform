import type { ResourceActions } from '@platform/resource';
import {
  approveRefundRequest,
  rejectRefundRequest,
  revealRefundField,
  runRefundAction,
} from './actions';

export const refundActions: ResourceActions = {
  create: async () => ({ ok: false, error: 'Creating refunds is not available.' }),
  update: async () => ({ ok: false, error: 'Editing refunds is not available.' }),
  run: runRefundAction,
  approve: approveRefundRequest,
  reject: rejectRefundRequest,
  reveal: revealRefundField,
};
