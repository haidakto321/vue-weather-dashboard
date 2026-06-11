import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// ESLint 10 flat config. Written as plain ESM (.mjs) so ESLint can load it without the
// extra `jiti` transpiler that a .ts config would need - this keeps the dependency set to
// exactly the agreed Phase-1 list (see implementation-notes.md). Legacy .eslintrc.cjs is
// not supported in ESLint 10. The Prettier preset is last so it turns off formatting rules
// that would otherwise fight Prettier.
export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
)
