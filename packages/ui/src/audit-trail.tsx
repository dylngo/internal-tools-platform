import { type AuditEntry, diffJson, listAuditEntries } from '@platform/audit';
import { formatValue } from './lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';

const REDACTED = '•••';

/**
 * Server component: the audit history of one resource, newest first, with
 * per-field diffs. Values of `redactFields` are replaced with a placeholder so
 * masked data does not leak through the history to readers who cannot reveal it.
 */
export async function AuditTrail({
  resourceType,
  resourceId,
  redactFields = [],
  limit = 50,
}: {
  resourceType: string;
  resourceId: string;
  redactFields?: string[];
  limit?: number;
}) {
  const entries = (await listAuditEntries(resourceType, resourceId)).slice(0, limit);
  const redacted = new Set(redactFields);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
        <CardDescription>Every change and sensitive read of this record.</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit entries yet.</p>
        ) : (
          <ol className="space-y-4">
            {entries.map((entry) => (
              <AuditEntryItem key={entry.id} entry={entry} redacted={redacted} />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function AuditEntryItem({ entry, redacted }: { entry: AuditEntry; redacted: Set<string> }) {
  const changes = diffJson(entry.before, entry.after).map((change) =>
    redacted.has(change.field)
      ? {
          field: change.field,
          before: change.before === undefined ? undefined : REDACTED,
          after: change.after === undefined ? undefined : REDACTED,
        }
      : change,
  );
  return (
    <li className="space-y-2 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium">{entry.action}</span>
        <span className="text-muted-foreground">
          by {entry.actorEmail} · {formatValue(entry.createdAt)}
        </span>
      </div>
      {changes.length > 0 ? (
        <table className="w-full text-xs">
          <tbody>
            {changes.map((change) => (
              <tr key={change.field} className="border-t">
                <td className="w-40 py-1 pr-2 font-mono text-muted-foreground">{change.field}</td>
                <td className="py-1 pr-2 text-destructive line-through">
                  {formatValue(change.before)}
                </td>
                <td className="py-1 text-emerald-700">{formatValue(change.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </li>
  );
}
