import eslint from "@eslint/js";
import next from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  globalIgnores([".next/**", "dist/**", "out/**", "build/**", "next-env.d.ts"]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  jsxA11y.flatConfigs.recommended,
  next.configs["core-web-vitals"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    // Remote media is served by the upstream site's image optimizer through the
    // hand-built URLs in src/data/assets.ts, so these files deliberately use a
    // plain <img>. Local images still go through next/image (see app/team).
    files: [
      "src/app/page.tsx",
      "src/app/about/page.tsx",
      "src/app/case-studies/_components/case-study-grid.tsx",
      "src/components/layout/site-footer.tsx",
      "src/components/layout/site-header.tsx",
      "src/components/lead-capture/lead-popup.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
