import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["components/crm/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Legacy client modules (voice demo WebRTC hook, discovery flows, demo CRM) predate
  // React Compiler hook rules - tracked for refactor; do not fail CI on push.
  {
    files: [
      "components/demo/**/*.{ts,tsx}",
      "components/discovery/**/*.{ts,tsx}",
      "hooks/use-voice-demo-live.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
