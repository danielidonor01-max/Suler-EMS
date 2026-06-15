import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Phase 6 acceptance gate — every interactive control must be
      // labelled either by visible text or an explicit aria-label /
      // aria-labelledby / title. Lifted as 'warn' so the build doesn't
      // collapse on the existing pre-Phase-6 buttons we haven't swept
      // yet; ratchet to 'error' once the codebase is clean.
      "jsx-a11y/control-has-associated-label": ["warn", {
        labelAttributes: ["aria-label", "aria-labelledby", "title"],
        controlComponents: [],
        ignoreElements: [],
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
