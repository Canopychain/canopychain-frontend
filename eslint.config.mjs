import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      // underscore-prefixed args are the convention here for signature-
      // mandated parameters we don't read.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // aimed at react compiler's cascading-render optimisation rather than
      // correctness. the effects it flags are ordinary mount and fetch-on-id
      // effects; revisit as part of adopting the compiler, not piecemeal.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
