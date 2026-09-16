import { platformContent, platformPreset } from '@platform/ui/tailwind-preset';
import type { Config } from 'tailwindcss';

export default {
  presets: [platformPreset],
  content: ['./app/**/*.{ts,tsx}', './resources/**/*.{ts,tsx}', ...platformContent],
} satisfies Config;
