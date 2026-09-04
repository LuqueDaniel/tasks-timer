import js from "@eslint/js";
import globals from "globals";
import reactDom from "eslint-plugin-react-dom";
import reactX from "eslint-plugin-react-x";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-dom": reactDom,
      "react-x": reactX,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: {
        version: "18.0",
      },
    },
    rules: {
      ...reactX.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...reactDom.configs.recommended.rules,

      // Preact uses the automatic JSX runtime (no React import in scope).
      "react-x/react-in-jsx-scope": "off",
      "react-x/jsx-uses-react": "off",

      // This project doesn't use runtime PropTypes.
      "react-x/prop-types": "off",

      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Keep ESLint and Prettier from fighting over formatting.
  prettier,
];
