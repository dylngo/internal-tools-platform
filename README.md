# internal-tools-platform

Foundation for internal tools: auth, RBAC, audit, approvals, and a declarative
resource layer that generates list/detail/form pages. `PLATFORM.md` is the spec.

## Apps

| App | Route | Port |
|---|---|---|
| KYC Review | `/applications` | 3000 |
| Feature Flags | `/flags` | 3001 |
| Refunds Operations | `/refunds` | 3000 |

## Prerequisites

- Node 20+, pnpm 12+
- Postgres 14 running locally (`postgresql://ubuntu:postgres@localhost:5432`)
- The `DATABASE_URL` in `.env` assumes the Devin environment's `ubuntu` Postgres role. A local install will typically use `postgres` instead.

## Setup

```sh
pnpm install
pnpm db:reset      # drop + recreate the dev schema, run migrations, seed synthetic data
pnpm dev           # apps/_template on http://localhost:3000
```

Use the "mock auth" switcher in the KYC Review app to act as any seeded user. Try:

1. As **Kim Kyc** (`kyc_analyst`), open the seeded **Synthetic Applicant 01**
   application at `/applications` and propose approval.
2. Switch to **Kai Approver** (`kyc_approver`) to approve it. The SSN stays
   masked, and Kim cannot approve her own request.

`.env` holds non-secret local defaults (`DATABASE_URL`, `AUTH_PROVIDER=mock`).

## Build cost

| Session | Mode | Build | Review findings | Fix | Total |
|---|---|---|---|---|---|
| Platform foundation | Ultra | 37m54s, +6,949 | self-caught SSN leak in audit trail | — | ~38m |
| KYC review | Lite | ~8m, +943 | 2 bugs, 2 security | resolved in merge | ~12m |
| Feature flags | Lite | 6m16s, +899 | 3 bugs | 2m57s | ~9m |
| Refunds | Lite | ~6m, +1,060 | 4 bugs, 2 flags | 9m3s | ~15m |

Plus 3m44s resolving a merge conflict between the two apps built in parallel. The refunds dashboard was built from a single sentence plus a reusable playbook, with no schema or field list supplied. Every review finding across all four sessions was the same class of defect: a check present in the UI but not enforced server-side, or a guarantee that held sequentially but not under concurrency.

## What this is not

No real OIDC (stubbed behind an AuthProvider interface with TODOs), no SCIM provisioning, no mobile, no external connectors, no rate limiting, no production hardening, synthetic data only. Built in roughly two hours as a scope demonstration, not a production system.

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
