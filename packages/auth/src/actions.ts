'use server';

import { revalidatePath } from 'next/cache';
import { getAuthProvider, getMockAuthProvider } from './provider';

export async function switchMockUser(userId: string): Promise<void> {
  await getMockAuthProvider().switchUser(userId);
  revalidatePath('/', 'layout');
}

export async function signOut(): Promise<void> {
  await getAuthProvider().signOut();
  revalidatePath('/', 'layout');
}
