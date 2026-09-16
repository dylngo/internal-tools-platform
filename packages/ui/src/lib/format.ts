/** `fullName` -> `Full name`, `balance_cents` -> `Balance cents`. */
export function humanize(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (value instanceof Date) {
    return value.toLocaleString('en-GB', { timeZone: 'UTC', timeZoneName: 'short' });
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/** Keeps the last `visible` characters and punctuation; hides the rest. `000-00-1234` -> `•••-••-1234`. */
export function maskValue(value: string, visible = 4): string {
  const cutoff = Math.max(0, value.length - visible);
  return value
    .split('')
    .map((char, index) => (index < cutoff && /[A-Za-z0-9]/.test(char) ? '•' : char))
    .join('');
}
