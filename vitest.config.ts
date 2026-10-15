import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['vitest.setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/**', '.agents/**'],
    // Aura 1.x reads `import.meta.env.VITEST` at module scope; Vitest must transform the module
    // so that `import.meta.env` is defined.
    server: { deps: { inline: ['@cognite/aura'] } },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Measure every source file, not only the ones a test happens to import.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'dist/',
        '.claude/',
        '.agents/',
        'vitest.setup.ts',
        '**/*.config.ts',
        '**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/__mocks__/**',
        'src/main.tsx',
      ],
    },
  },
});
