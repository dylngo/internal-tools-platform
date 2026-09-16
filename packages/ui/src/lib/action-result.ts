/**
 * What every server action returns. Errors are values, not thrown, so client
 * components can render them next to the control that triggered the action.
 */
export type ActionResult =
  | { ok: true; message?: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      /** Submitted values, echoed back so a failed form keeps what the user typed. */
      values?: Record<string, string | boolean>;
    };

export type RevealResult = { ok: true; value: string } | { ok: false; error: string };

export const ok = (message?: string): ActionResult => ({ ok: true, message });
export const fail = (
  error: string,
  fieldErrors?: Record<string, string[]>,
  values?: Record<string, string | boolean>,
): ActionResult => ({ ok: false, error, fieldErrors, values });
