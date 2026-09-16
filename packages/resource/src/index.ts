export type { ActionResult, RevealResult } from '@platform/ui';
export { createResourceActions, type ResourceActions } from './actions';
export {
  type AnyResource,
  defineResource,
  type Resource,
  type ResourceAction,
  type ResourceColumn,
  type ResourceConfig,
  type ResourceFilter,
  type ResourceTable,
  type RowOf,
} from './define-resource';
export { Forbidden } from './forbidden';
export { findRow, listRows } from './query';
export { ResourceDetail } from './resource-detail';
export { ResourceEdit, ResourceNew } from './resource-form-pages';
export { ResourceList } from './resource-list';
