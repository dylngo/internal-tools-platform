import type { ResourceActions } from '@platform/resource';
import {
  approveKycApplicationRequest,
  rejectKycApplicationRequest,
  revealKycApplicationField,
  runKycApplicationAction,
} from './actions';

export const kycApplicationActions: ResourceActions = {
  create: async () => ({ ok: false, error: 'Creating KYC applications is not available.' }),
  update: async () => ({ ok: false, error: 'Editing KYC applications is not available.' }),
  run: runKycApplicationAction,
  approve: approveKycApplicationRequest,
  reject: rejectKycApplicationRequest,
  reveal: revealKycApplicationField,
};
