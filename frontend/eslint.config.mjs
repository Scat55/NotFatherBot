// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import prettierPlugin from "eslint-plugin-prettier";

export default withNuxt({
  ignores: ["node_modules", ".nuxt", ".output", "dist"],
  plugins: {
    prettier: prettierPlugin,
  },
  rules: {
    "prettier/prettier": [
      "error",
      {
        semi: true,
        printWidth: 80,
        tabWidth: 2,
        bracketSpacing: true,
        singleQuote: false,
      },
    ],

    // Отключаем — в Nuxt index.vue и layouts это норма
    "vue/multi-word-component-names": "off",

    // Отключаем — shadcn компоненты не требуют default props
    "vue/require-default-prop": "off",

    // Предупреждение вместо ошибки — any иногда нужен
    "@typescript-eslint/no-explicit-any": "warn",

    // Предупреждение вместо ошибки
    "@typescript-eslint/no-non-null-assertion": "warn",

    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],

    "vue/v-bind-style": ["error", "shorthand"],
    "vue/v-on-style": ["error", "shorthand"],
    "vue/define-macros-order": [
      "error",
      {
        order: ["defineProps", "defineEmits", "defineSlots"],
      },
    ],
    "vue/no-v-html": "error",
    "no-console": ["error", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    eqeqeq: ["error", "always"],
  },
});
