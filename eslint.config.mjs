import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Phase 6 acceptance gate. Phase 8 swept Phase 4-6 code + the
      // legacy modal cluster (75 → 0 violations) so this is now an
      // 'error', not a 'warn' — regressions block CI.
      //
      // `ignoreElements: ['td']` — td is not an interactive control by
      // ARIA spec; the rule mis-flagged loading-skeleton cells because
      // `depth: 3` recursed past empty placeholder divs. Excluding td
      // keeps the rule strict on actual controls (button/input/textarea/select).
      "jsx-a11y/control-has-associated-label": ["error", {
        labelAttributes: ["aria-label", "aria-labelledby", "title"],
        controlComponents: [],
        ignoreElements: ["td"],
        depth: 3,
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Phase 1-6 scratch test scripts — not production code.
    "scratch/**",
  ]),
]);

export default eslintConfig;
