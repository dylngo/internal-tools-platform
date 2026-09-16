import type { ResourceActions } from '@platform/resource';
import {
  approveFeatureFlagRequest,
  createFeatureFlag,
  rejectFeatureFlagRequest,
  revealFeatureFlagField,
  runFeatureFlagAction,
  updateFeatureFlag,
} from './actions';

export const featureFlagActions: ResourceActions = {
  create: createFeatureFlag,
  update: updateFeatureFlag,
  run: runFeatureFlagAction,
  approve: approveFeatureFlagRequest,
  reject: rejectFeatureFlagRequest,
  reveal: revealFeatureFlagField,
};
