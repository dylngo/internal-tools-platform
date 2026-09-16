'use server';

import { type ActionResult, createResourceActions, type RevealResult } from '@platform/resource';
import { featureFlagResource } from '@/resources/feature-flag';

const actions = createResourceActions(featureFlagResource);

export async function createFeatureFlag(previous: ActionResult | null, formData: FormData) {
  return actions.create(previous, formData);
}

export async function updateFeatureFlag(
  id: string,
  previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return actions.update(id, previous, formData);
}

export async function runFeatureFlagAction(actionName: string, id: string): Promise<ActionResult> {
  return actions.run(actionName, id);
}

export async function approveFeatureFlagRequest(requestId: string): Promise<ActionResult> {
  return actions.approve(requestId);
}

export async function rejectFeatureFlagRequest(requestId: string): Promise<ActionResult> {
  return actions.reject(requestId);
}

export async function revealFeatureFlagField(field: string, id: string): Promise<RevealResult> {
  return actions.reveal(field, id);
}
