import { platformContent, platformPreset } from '@platform/ui/tailwind-preset';
import type { Config } from 'tailwindcss';

const config = {
  presets: [platformPreset],
  content: ['./app/**/*.{ts,tsx}', './resources/**/*.{ts,tsx}', ...platformContent],
} satisfies Config;

export default config;
