import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind preset. Apps do:
 *
 *   import { platformPreset, platformContent } from '@platform/ui/tailwind-preset';
 *   export default { presets: [platformPreset], content: [...platformContent, './app/**\/*.tsx'] };
 */
export const platformPreset: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};

/** Globs for every platform package that renders JSX, relative to an app directory. */
export const platformContent = [
  '../../packages/ui/src/**/*.{ts,tsx}',
  '../../packages/resource/src/**/*.{ts,tsx}',
  '../../packages/auth/src/**/*.{ts,tsx}',
  '../../packages/rbac/src/**/*.{ts,tsx}',
];
