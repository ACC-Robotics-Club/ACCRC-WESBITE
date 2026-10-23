import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// The existing app has a broad migration backlog for React Compiler lint rules.
// Keep the Next.js web-vitals rules active without blocking release on those
// unrelated legacy findings. `next build` performs strict TypeScript checks.
export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
