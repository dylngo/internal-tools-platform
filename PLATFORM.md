# Internal Tools Platform

A shared foundation for building internal operational tools. The goal is that the
Nth tool costs a fraction of the first: auth, permissions, audit, approvals, and
table/form UI are solved once, in `packages/`, and every app in `apps/` consumes them.

This document is the contract. Apps depend on the interfaces described here, not on
each other. If you need something that isn't here, add it to a package — do not
solve it locally inside an app.

## Stack

- pnpm workspaces, TypeScript strict mode
- Next.js 15 (App Router), React Server Components by default
- Postgres 14 + Drizzle ORM
- Tailwind + shadcn/ui
- Vitest

No auth-provider SDKs, no paid services, no state management library. Keep total
direct dependencies under 12.

## Layout

```
apps/
  kyc-review/
  feature-flags/
  _template/            # copied when scaffolding a new app
packages/
  auth/                 # @platform/auth
  rbac/                 # @platform/rbac
  audit/                # @platform/audit
  resource/             # @platform/resource
  ui/                   # @platform/ui
  db/                   # @platform/db  — schema, migrations, seed
```

Each app is a Next.js route group mounted at `/<app-name>`. Apps own their schema
tables, their resource definitions, and their views. Nothing else.

## Core concepts

**Resource** — a declarative description of a thing operators work with: a Drizzle
table, a Zod schema, the permissions that gate it, and the actions that can be taken
on it. The platform renders list and detail views from this definition.

**Permission** — a `domain:verb` string (`kyc:approve`, `flags:write_prod`). Roles
are bags of permissions, defined as data in `packages/rbac/roles.ts`. Permission
checks happen server-side; UI-level hiding is a convenience, never the enforcement.

**Audit** — every mutation writes an append-only row recording who did what to which
record, with a before/after diff, in the same transaction as the mutation itself.
If the mutation commits, the audit row committed. There is no path to mutate state
without an audit row.

**Approval (maker-checker)** — an action marked `requiresApproval` does not execute
when invoked. It creates a pending approval request. A *different* user holding the
named permission must approve it before the effect occurs. This is the primitive
that makes the platform usable for money movement and customer-status changes.

## Package reference

### `@platform/auth`

```ts
interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthProvider {
  getCurrentUser(): Promise<User | null>;
  signOut(): Promise<void>;
}
```

Two implementations:

- `MockAuthProvider` — reads a seeded user from a cookie; a dev-only user switcher
  component lets a reviewer change identity to test permission paths. Active when
  `AUTH_PROVIDER=mock`.
- `OIDCAuthProvider` — **stub only**. Implement the interface with clearly marked
  `TODO` comments showing exactly where an Okta/Entra integration would slot in
  (discovery URL, code exchange, token validation, claims-to-roles mapping, session
  cookie). Do not pull in an OIDC library. Do not implement token validation.

`getCurrentUser()` is the single source of identity. Never read a session cookie
directly from an app.

### `@platform/rbac`

```ts
function can(user: User, permission: Permission): boolean;
function requirePermission(user: User | null, permission: Permission): void; // throws 403
```

Plus `<RequirePermission permission="..." fallback={...}>` for conditional UI.

Roles are static data:

```ts
export const ROLES = {
  kyc_analyst:    ['kyc:read', 'kyc:propose'],
  kyc_approver:   ['kyc:read', 'kyc:propose', 'kyc:approve', 'kyc:view_pii'],
  flags_engineer: ['flags:read', 'flags:write'],
  flags_admin:    ['flags:read', 'flags:write', 'flags:write_prod'],
  auditor:        ['audit:read'],
} as const;
```

Server-side enforcement is mandatory in every action handler and every server
component that loads sensitive data. A hidden button is not access control.

### `@platform/audit`

```ts
withAudit<T>(
  ctx: { actor: User; action: string; resourceType: string; resourceId: string },
  fn: (tx: Transaction) => Promise<{ before?: unknown; after?: unknown; result: T }>
): Promise<T>
```

Writes to `audit_log`: `id, actor_id, actor_email, action, resource_type,
resource_id, before, after, created_at`. The table has no `UPDATE` or `DELETE`
path exposed anywhere in the codebase.

Reads can be audited too — `kyc:view_pii` unmasking is an audited event with
`action: 'pii.unmask'` and no diff.

### `@platform/resource`

```ts
defineResource({
  name: 'kycApplication',
  table: kycApplications,
  schema: kycApplicationSchema,      // Zod
  permissions: { read: 'kyc:read', write: 'kyc:propose' },
  list: { columns: [...], filters: [...], defaultSort: 'submittedAt' },
  actions: [
    { name: 'approve', permission: 'kyc:approve', requiresApproval: true, handler },
  ],
})
```

Given a resource, the platform provides `<ResourceList resource={...} />` and
`<ResourceDetail resource={...} />`. Actions render as buttons, are permission-gated,
route through `withAudit`, and route through `ApprovalGate` when `requiresApproval`.

The generated edit form only covers `editableFields`: schema fields minus
`form.createOnly` and anything in `detail.masked`. State that must move through an
action (e.g. `status`) belongs in `createOnly`, so a free edit can never bypass
maker-checker, and a masked value is never rendered into a form.

This layer is the point of the whole platform. When adding an app, the work should
be writing a resource definition — not writing tables, forms, or handlers.

### `@platform/ui`

- `DataTable` — server-side pagination, column filters, sort. Takes columns + a
  loader function. Do not write a second table component.
- `ResourceForm` — renders and validates a form from a Zod schema.
- `ApprovalGate` — shows pending requests, enforces that `approver.id !== maker.id`,
  and exposes approve/reject.
- `AuditTrail` — renders the audit history for a given `resourceType` + `resourceId`.
- `MaskedField` — hides a value behind a permission; unmasking fires an audit event.

### `@platform/db`

Schema, migrations, and `seed.ts`. All seed data is synthetic and obviously fake:
SSNs in the `000-00-XXXX` range, card numbers starting `4111`, emails
`@example.test`. Never generate realistic PII, even fictional.

## Adding a new tool

1. Copy `apps/_template` to `apps/<name>`.
2. Add tables to `packages/db/schema/<name>.ts`; generate a migration.
3. Add permissions and role grants to `packages/rbac/roles.ts`.
4. Write `apps/<name>/resources/<name>.ts` using `defineResource`.
5. Mount list and detail routes using `ResourceList` / `ResourceDetail`.
6. Mark money-moving or customer-status actions `requiresApproval: true`.
7. Add synthetic seed rows covering every status and permission path.
8. Add two tests: a denied-permission path and an audit-row-written path.
9. `pnpm verify`, then load the app in a browser and screenshot it.

If step 4 doesn't cover what you need, the gap belongs in `@platform/resource`,
not in the app.

## Rules

- Server-side permission checks in every handler. No exceptions.
- No direct DB access from page components — go through a resource.
- No new UI primitives. Extend `@platform/ui` or use what's there.
- No new top-level dependency without a justification in the PR description.
- Readable over clever. A human reviews every line of this.

## Verification

`pnpm verify` = typecheck + lint + test. A PR without a passing verify and a
screenshot of the running app is not ready for review.

## Deliberately not built

Real OIDC, SSO/SCIM provisioning, rate limiting, secrets management, multi-tenancy,
mobile, offline support, external integrations, and production hardening. These are
stubbed or absent by design — this is a scope demonstration, not a production system.
