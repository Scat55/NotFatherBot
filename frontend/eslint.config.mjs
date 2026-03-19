// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // ─── Prettier ───────────────────────────────────────────
    // Форматирование через ESLint — ошибка, а не warning.
    // Warning в проде бесполезны: игнорируются и засоряют лог.
    "prettier/prettier": ["error", {
      "semi": true,
      "printWidth": 80,
      "tabWidth": 2,
      "bracketSpacing": true,
      "singleQuote": false
    }],

    // ─── TypeScript — строгость ──────────────────────────────
    // Запрещает any явный. Если обходишь типизацию — делай это осознанно.
    "@typescript-eslint/no-explicit-any": "error",

    // Неиспользуемые переменные — баги, а не стиль.
    // Исключение: _prefix для намеренно игнорируемых аргументов.
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],

    // Запрещает non-null assertion (value!). Используй явные проверки.
    "@typescript-eslint/no-non-null-assertion": "error",

    // ─── Vue / Nuxt ──────────────────────────────────────────
    // Обязательный multi-word для имён компонентов.
    // Иначе конфликты с нативными HTML-тегами.
    "vue/multi-word-component-names": "error",

    // v-bind и v-on в сокращённой форме — единообразие.
    "vue/v-bind-style": ["error", "shorthand"],
    "vue/v-on-style": ["error", "shorthand"],

    // Порядок свойств в defineProps/defineEmits — читаемость.
    "vue/define-macros-order": ["error", {
      "order": ["defineProps", "defineEmits", "defineSlots"]
    }],

    // Запрещает v-html — XSS риск. Если нужен — отключай точечно с комментарием.
    "vue/no-v-html": "error",

    // ─── Общая логика ────────────────────────────────────────
    // Запрещает console.log в коде. console.warn/error — допустимы для явных сигналов.
    "no-console": ["error", { "allow": ["warn", "error"] }],

    // Запрещает debugger в коде.
    "no-debugger": "error",

    // Запрещает == в пользу ===. Неявные приведения типов — источник багов.
    "eqeqeq": ["error", "always"]
  }
})
