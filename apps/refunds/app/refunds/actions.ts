'use server';

import { type ActionResult, createResourceActions, type RevealResult } from '@platform/resource';
import { refundResource } from '@/resources/refund';

const actions = createResourceActions(refundResource);

export async function runRefundAction(
  actionName: string,
  id: string,
  input?: string,
): Promise<ActionResult> {
  return actions.run(actionName, id, input);
}

export async function approveRefundRequest(requestId: string): Promise<ActionResult> {
  return actions.approve(requestId);
}

export async function rejectRefundRequest(requestId: string): Promise<ActionResult> {
  return actions.reject(requestId);
}

export async function revealRefundField(field: string, id: string): Promise<RevealResult> {
  return actions.reveal(field, id);
}
