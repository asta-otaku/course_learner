import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // Remaining untyped API payloads. Catch sites use getErrorMessage(); a
      // dedicated payload-typing pass can turn this back on as an error.
      "@typescript-eslint/no-explicit-any": "off",
      // next/image is unoptimized project-wide; many srcs are user uploads with
      // runtime CSS sizing (QuestionImage, avatars, blobs).
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": "allow-with-description",
          "ts-expect-error": "allow-with-description",
          minimumDescriptionLength: 3,
        },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];

export default eslintConfig;
