'use server';

import { type ActionResult, createResourceActions, type RevealResult } from '@platform/resource';
import { customerResource } from '@/resources/customer';

// Next.js only exposes async functions exported from a 'use server' file as
// server actions, so the generated handlers are re-exported one by one here.
const actions = createResourceActions(customerResource);

export async function createCustomer(
  previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return actions.create(previous, formData);
}

export async function updateCustomer(
  id: string,
  previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return actions.update(id, previous, formData);
}

export async function runCustomerAction(actionName: string, id: string): Promise<ActionResult> {
  return actions.run(actionName, id);
}

export async function approveCustomerRequest(requestId: string): Promise<ActionResult> {
  return actions.approve(requestId);
}

export async function rejectCustomerRequest(requestId: string): Promise<ActionResult> {
  return actions.reject(requestId);
}

export async function revealCustomerField(field: string, id: string): Promise<RevealResult> {
  return actions.reveal(field, id);
}
