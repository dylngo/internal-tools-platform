# internal-tools-platform

Foundation for internal tools: auth, RBAC, audit, approvals, and a declarative
resource layer that generates list/detail/form pages. `PLATFORM.md` is the spec.

## Prerequisites

- Node 20+, pnpm 12+
- Postgres 14 running locally (`postgresql://ubuntu:postgres@localhost:5432`)

## Setup

```sh
pnpm install
pnpm db:reset      # drop + recreate the dev schema, run migrations, seed synthetic data
pnpm dev           # apps/_template on http://localhost:3000
```

Use the "mock auth" switcher in the header to act as any seeded user. Try:

1. As **Chris Checker** (`template_approver`), open a customer and approve the
   seeded pending "suspend" request that **Ana Analyst** proposed.
2. As Ana, note that the SSN stays masked and she cannot approve her own request.

`.env` holds non-secret local defaults (`DATABASE_URL`, `AUTH_PROVIDER=mock`).

## Verify

```sh
pnpm verify        # typecheck + lint (Biome) + tests (Vitest against internal_tools_test)
```

## Layout

```
apps/_template        Next.js 15 starter wired to the `customers` resource
packages/auth         AuthProvider, MockAuthProvider, OIDC stub
packages/rbac         roles/permissions as data, can(), requirePermission, <RequirePermission>
packages/audit        withAudit(), audit read helpers
packages/ui           DataTable, ResourceForm, ApprovalGate, AuditTrail, MaskedField, primitives
packages/resource     defineResource → ResourceList/Detail/New/Edit + server actions
packages/db           Drizzle schema, migrations, seed
```

See "Adding a new tool" in `PLATFORM.md` for the copy-the-template workflow.
