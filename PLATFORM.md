\# Internal Tools Platform



A shared foundation for building internal operational tools. The goal is that the

Nth tool costs a fraction of the first: auth, permissions, audit, approvals, and

table/form UI are solved once, in `packages/`, and every app in `apps/` consumes them.



This document is the contract. Apps depend on the interfaces described here, not on

each other. If you need something that isn't here, add it to a package — do not

solve it locally inside an app.



\## Stack



\- pnpm workspaces, TypeScript strict mode

\- Next.js 15 (App Router), React Server Components by default

\- Postgres 16 + Drizzle ORM

\- Tailwind + shadcn/ui

\- Vitest



No auth-provider SDKs, no paid services, no state management library. Keep total

direct dependencies under 12.



\## Layout



```

apps/

&#x20; kyc-review/

&#x20; feature-flags/

&#x20; \_template/            # copied when scaffolding a new app

packages/

&#x20; auth/                 # @platform/auth

&#x20; rbac/                 # @platform/rbac

&#x20; audit/                # @platform/audit

&#x20; resource/             # @platform/resource

&#x20; ui/                   # @platform/ui

&#x20; db/                   # @platform/db  — schema, migrations, seed

```



Each app is a Next.js route group mounted at `/<app-name>`. Apps own their schema

tables, their resource definitions, and their views. Nothing else.



\## Core concepts



\*\*Resource\*\* — a declarative description of a thing operators work with: a Drizzle

table, a Zod schema, the permissions that gate it, and the actions that can be taken

on it. The platform renders list and detail views from this definition.



\*\*Permission\*\* — a `domain:verb` string (`kyc:approve`, `flags:write\_prod`). Roles

are bags of permissions, defined as data in `packages/rbac/roles.ts`. Permission

checks happen server-side; UI-level hiding is a convenience, never the enforcement.



\*\*Audit\*\* — every mutation writes an append-only row recording who did what to which

record, with a before/after diff, in the same transaction as the mutation itself.

If the mutation commits, the audit row committed. There is no path to mutate state

without an audit row.



\*\*Approval (maker-checker)\*\* — an action marked `requiresApproval` does not execute

when invoked. It creates a pending approval request. A \*different\* user holding the

named permission must approve it before the effect occurs. This is the primitive

that makes the platform usable for money movement and customer-status changes.



\## Package reference



\### `@platform/auth`



```ts

interface User {

&#x20; id: string;

&#x20; email: string;

&#x20; name: string;

&#x20; roles: string\[];

}



interface AuthProvider {

&#x20; getCurrentUser(): Promise<User | null>;

&#x20; signOut(): Promise<void>;

}

```



Two implementations:



\- `MockAuthProvider` — reads a seeded user from a cookie; a dev-only user switcher

&#x20; component lets a reviewer change identity to test permission paths. Active when

&#x20; `AUTH\_PROVIDER=mock`.

\- `OIDCAuthProvider` — \*\*stub only\*\*. Implement the interface with clearly marked

&#x20; `TODO` comments showing exactly where an Okta/Entra integration would slot in

&#x20; (discovery URL, code exchange, token validation, claims-to-roles mapping, session

&#x20; cookie). Do not pull in an OIDC library. Do not implement token validation.



`getCurrentUser()` is the single source of identity. Never read a session cookie

directly from an app.



\### `@platform/rbac`



```ts

function can(user: User, permission: Permission): boolean;

function requirePermission(user: User | null, permission: Permission): void; // throws 403

```



Plus `<RequirePermission permission="..." fallback={...}>` for conditional UI.



Roles are static data:



```ts

export const ROLES = {

&#x20; kyc\_analyst:    \['kyc:read', 'kyc:propose'],

&#x20; kyc\_approver:   \['kyc:read', 'kyc:propose', 'kyc:approve', 'kyc:view\_pii'],

&#x20; flags\_engineer: \['flags:read', 'flags:write'],

&#x20; flags\_admin:    \['flags:read', 'flags:write', 'flags:write\_prod'],

&#x20; auditor:        \['audit:read'],

} as const;

```



Server-side enforcement is mandatory in every action handler and every server

component that loads sensitive data. A hidden button is not access control.



\### `@platform/audit`



```ts

withAudit<T>(

&#x20; ctx: { actor: User; action: string; resourceType: string; resourceId: string },

&#x20; fn: (tx: Transaction) => Promise<{ before?: unknown; after?: unknown; result: T }>

): Promise<T>

```



Writes to `audit\_log`: `id, actor\_id, actor\_email, action, resource\_type,

resource\_id, before, after, created\_at`. The table has no `UPDATE` or `DELETE`

path exposed anywhere in the codebase.



Reads can be audited too — `kyc:view\_pii` unmasking is an audited event with

`action: 'pii.unmask'` and no diff.



\### `@platform/resource`



```ts

defineResource({

&#x20; name: 'kycApplication',

&#x20; table: kycApplications,

&#x20; schema: kycApplicationSchema,      // Zod

&#x20; permissions: { read: 'kyc:read', write: 'kyc:propose' },

&#x20; list: { columns: \[...], filters: \[...], defaultSort: 'submittedAt' },

&#x20; actions: \[

&#x20;   { name: 'approve', permission: 'kyc:approve', requiresApproval: true, handler },

&#x20; ],

})

```



Given a resource, the platform provides `<ResourceList resource={...} />` and

`<ResourceDetail resource={...} />`. Actions render as buttons, are permission-gated,

route through `withAudit`, and route through `ApprovalGate` when `requiresApproval`.



This layer is the point of the whole platform. When adding an app, the work should

be writing a resource definition — not writing tables, forms, or handlers.



\### `@platform/ui`



\- `DataTable` — server-side pagination, column filters, sort. Takes columns + a

&#x20; loader function. Do not write a second table component.

\- `ResourceForm` — renders and validates a form from a Zod schema.

\- `ApprovalGate` — shows pending requests, enforces that `approver.id !== maker.id`,

&#x20; and exposes approve/reject.

\- `AuditTrail` — renders the audit history for a given `resourceType` + `resourceId`.

\- `MaskedField` — hides a value behind a permission; unmasking fires an audit event.



\### `@platform/db`



Schema, migrations, and `seed.ts`. All seed data is synthetic and obviously fake:

SSNs in the `000-00-XXXX` range, card numbers starting `4111`, emails

`@example.test`. Never generate realistic PII, even fictional.



\## Adding a new tool



1\. Copy `apps/\_template` to `apps/<name>`.

2\. Add tables to `packages/db/schema/<name>.ts`; generate a migration.

3\. Add permissions and role grants to `packages/rbac/roles.ts`.

4\. Write `apps/<name>/resources/<name>.ts` using `defineResource`.

5\. Mount list and detail routes using `ResourceList` / `ResourceDetail`.

6\. Mark money-moving or customer-status actions `requiresApproval: true`.

7\. Add synthetic seed rows covering every status and permission path.

8\. Add two tests: a denied-permission path and an audit-row-written path.

9\. `pnpm verify`, then load the app in a browser and screenshot it.



If step 4 doesn't cover what you need, the gap belongs in `@platform/resource`,

not in the app.



\## Rules



\- Server-side permission checks in every handler. No exceptions.

\- No direct DB access from page components — go through a resource.

\- No new UI primitives. Extend `@platform/ui` or use what's there.

\- No new top-level dependency without a justification in the PR description.

\- Readable over clever. A human reviews every line of this.



\## Verification



`pnpm verify` = typecheck + lint + test. A PR without a passing verify and a

screenshot of the running app is not ready for review.



\## Deliberately not built



Real OIDC, SSO/SCIM provisioning, rate limiting, secrets management, multi-tenancy,

mobile, offline support, external integrations, and production hardening. These are

stubbed or absent by design — this is a scope demonstration, not a production system.

