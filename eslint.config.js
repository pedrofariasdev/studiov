const { defineConfig, globalIgnores } = require("eslint/config");
const js = require("@eslint/js");
const globals = require("globals");

module.exports = defineConfig([
  globalIgnores(["node_modules/**", "dist/**", "build/**", "coverage/**", "supabase/.temp/**"]),

  {
    name: "StudioV Browser JavaScript",

    files: ["js/**/*.js"],

    extends: [js.configs.recommended],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",

      globals: {
        ...globals.browser,

        // Bibliotecas carregadas pelo HTML através de CDN.
        supabase: "readonly",
        lucide: "readonly",
      },
    },

    rules: {
      "no-undef": "error",
      "no-unreachable": "error",
      "no-constant-condition": ["error", { checkLoops: false }],

      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "prefer-const": "warn",

      // Permitido durante o desenvolvimento.
      "no-console": "off",
    },
  },
]);
