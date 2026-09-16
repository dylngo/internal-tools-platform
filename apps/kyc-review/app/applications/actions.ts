'use server';

import { type ActionResult, createResourceActions, type RevealResult } from '@platform/resource';
import { kycApplicationResource } from '@/resources/kyc-application';

const actions = createResourceActions(kycApplicationResource);

export async function runKycApplicationAction(
  actionName: string,
  id: string,
  input?: string,
): Promise<ActionResult> {
  return actions.run(actionName, id, input);
}

export async function approveKycApplicationRequest(requestId: string): Promise<ActionResult> {
  return actions.approve(requestId);
}

export async function rejectKycApplicationRequest(requestId: string): Promise<ActionResult> {
  return actions.reject(requestId);
}

export async function revealKycApplicationField(field: string, id: string): Promise<RevealResult> {
  return actions.reveal(field, id);
}
