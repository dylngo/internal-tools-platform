'use client';

import { useState, useTransition } from 'react';
import type { RevealResult } from './lib/action-result';
import { Button } from './primitives/button';

export function MaskedFieldClient({
  masked,
  reveal,
}: {
  masked: string;
  reveal: () => Promise<RevealResult>;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onReveal() {
    startTransition(async () => {
      const result = await reveal();
      if (result.ok) {
        setRevealed(result.value);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-mono">{revealed ?? masked}</span>
      {revealed === null ? (
        <Button variant="outline" size="sm" onClick={onReveal} disabled={pending}>
          {pending ? 'Revealing…' : 'Reveal'}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setRevealed(null)}>
          Hide
        </Button>
      )}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </span>
  );
}
