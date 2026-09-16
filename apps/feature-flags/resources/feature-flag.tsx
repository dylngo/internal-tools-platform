import { type FeatureFlagRow, FLAG_ENVIRONMENTS, FLAG_STATES, featureFlags } from '@platform/db';
import { defineResource } from '@platform/resource';
import { Badge, statusVariant } from '@platform/ui';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const featureFlagSchema = z.object({
  rolloutPercentage: z.number().int().min(0).max(100).describe('Rollout percentage'),
});

function writePermission(row: FeatureFlagRow) {
  return row.environment === 'production' ? 'flags:write_prod' : 'flags:write';
}

export const featureFlagResource = defineResource({
  name: 'featureFlag',
  label: 'Feature flag',
  pluralLabel: 'Feature flags',
  basePath: '/flags',
  table: featureFlags,
  schema: featureFlagSchema,
  permissions: { read: 'flags:read', write: 'flags:write' },
  create: false,
  writePermission,
  list: {
    columns: [
      {
        key: 'name',
        render: (row) => <span className="font-medium">{row.name}</span>,
      },
      'description',
      {
        key: 'environment',
        render: (row) => <Badge variant="outline">{row.environment}</Badge>,
      },
      {
        key: 'state',
        render: (row) => <Badge variant={statusVariant(row.state)}>{row.state}</Badge>,
      },
      {
        key: 'rolloutPercentage',
        header: 'Rollout',
        render: (row) => `${row.rolloutPercentage}%`,
      },
    ],
    filters: [
      { key: 'name', label: 'Name' },
      { key: 'environment', options: FLAG_ENVIRONMENTS },
      { key: 'state', options: FLAG_STATES },
    ],
    defaultSort: 'name',
    defaultDirection: 'asc',
  },
  detail: {
    titleField: 'name',
    fields: [
      'name',
      'description',
      'environment',
      'state',
      'rolloutPercentage',
      'createdAt',
      'updatedAt',
    ],
  },
  actions: [
    {
      name: 'toggle',
      label: 'Toggle state',
      permission: 'flags:write',
      permissionFor: writePermission,
      handler: async ({ tx, row }) => {
        const [updated] = await tx
          .update(featureFlags)
          .set({
            state: row.state === 'enabled' ? 'disabled' : 'enabled',
            updatedAt: new Date(),
          })
          .where(eq(featureFlags.id, row.id))
          .returning();
        if (!updated) throw new Error('Feature flag disappeared mid-update');
        return updated;
      },
    },
  ],
});
