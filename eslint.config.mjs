import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const directory = path.dirname(filename);
const compat = new FlatCompat({ baseDirectory: directory });

const config = [
  {
    ignores: [".next/**", ".next-dev/**", ".codex-tmp/**", "node_modules/**", "dist/**", "out/**", ".wrangler/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: { "import/no-anonymous-default-export": "off" },
  },
];

export default config;
