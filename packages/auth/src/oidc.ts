import type { AuthProvider, User } from './types';

/**
 * STUB. Shape of an Okta / Entra ID integration using plain OpenID Connect
 * (authorization code flow with PKCE). Nothing here is implemented; every TODO
 * marks where real code goes. Do not add an OIDC SDK — the flow is a handful of
 * HTTPS requests and a JWT signature check.
 *
 * Expected environment:
 *   OIDC_ISSUER        e.g. https://acme.okta.com/oauth2/default
 *                      or  https://login.microsoftonline.com/<tenant>/v2.0
 *   OIDC_CLIENT_ID
 *   OIDC_CLIENT_SECRET (or a private key for private_key_jwt)
 *   OIDC_REDIRECT_URI  e.g. https://tools.acme.internal/auth/callback
 *   SESSION_SECRET     used to sign the session cookie
 */
export class OIDCAuthProvider implements AuthProvider {
  static readonly SESSION_COOKIE = 'platform_session';

  async getCurrentUser(): Promise<User | null> {
    // TODO(oidc): read the `platform_session` cookie via next/headers.
    // TODO(oidc): verify the cookie's HMAC (SESSION_SECRET) and expiry; return
    //             null if missing or invalid so callers redirect to sign-in.
    // TODO(oidc): decode the session payload { sub, email, name, roles, exp }
    //             and return it as a User. Roles were mapped at sign-in time
    //             (see handleCallback), so no IdP call happens per request.
    return null;
  }

  async signOut(): Promise<void> {
    // TODO(oidc): delete the `platform_session` cookie.
    // TODO(oidc): optionally redirect to the IdP's end_session_endpoint from
    //             discovery so the IdP session ends too (RP-initiated logout).
  }

  /** Step 1 — where /auth/sign-in sends the browser. */
  async getAuthorizationUrl(_state: string, _codeChallenge: string): Promise<string> {
    // TODO(oidc): fetch `${OIDC_ISSUER}/.well-known/openid-configuration` and
    //             cache it; use its authorization_endpoint.
    // TODO(oidc): build the URL with response_type=code, client_id,
    //             redirect_uri, scope="openid profile email groups" (Okta) or
    //             "openid profile email" (Entra; groups come via the token
    //             claims config), state, code_challenge, code_challenge_method=S256.
    // TODO(oidc): persist state + PKCE verifier in a short-lived httpOnly cookie.
    throw new Error('OIDCAuthProvider.getAuthorizationUrl is not implemented');
  }

  /** Step 2 — /auth/callback receives ?code=&state=. */
  async handleCallback(_code: string, _state: string): Promise<User> {
    // TODO(oidc): compare state with the cookie from step 1; reject on mismatch.
    // TODO(oidc): POST to token_endpoint with grant_type=authorization_code,
    //             code, redirect_uri, client_id, client_secret (or client
    //             assertion), code_verifier. Receive id_token (+ access_token).
    // TODO(oidc): validate the id_token: fetch jwks_uri, verify the RS256
    //             signature against the matching `kid`, then check iss, aud,
    //             exp, nonce. Use node:crypto (crypto.subtle / createVerify);
    //             no JWT library needed.
    // TODO(oidc): map claims to a User:
    //               id    <- sub
    //               email <- email (Okta) / preferred_username or email (Entra)
    //               name  <- name
    //               roles <- mapGroupsToRoles(groups claim)  — see below
    // TODO(oidc): upsert the user into the `users` table so audit rows can
    //             always resolve actor_id to a person.
    // TODO(oidc): write the signed `platform_session` cookie (httpOnly, secure,
    //             sameSite=lax, short expiry; refresh on activity).
    throw new Error('OIDCAuthProvider.handleCallback is not implemented');
  }
}

/**
 * IdP group -> platform role. Keys are the group names (Okta) or group object
 * ids / app roles (Entra) as they appear in the token; values are keys of ROLES
 * in @platform/rbac. Kept as data so a reviewer can see exactly who gets what.
 */
export const OIDC_GROUP_TO_ROLE: Record<string, string> = {
  // TODO(oidc): fill in, e.g.
  // 'tools-kyc-analysts': 'kyc_analyst',
  // 'tools-kyc-approvers': 'kyc_approver',
};

export function mapGroupsToRoles(groups: string[]): string[] {
  return groups.flatMap((group) => {
    const role = OIDC_GROUP_TO_ROLE[group];
    return role ? [role] : [];
  });
}
