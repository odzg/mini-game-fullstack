import type { Config } from 'prettier';
import type { PluginOptions } from 'prettier-plugin-tailwindcss';

export default {
  plugins: ['prettier-plugin-tailwindcss'],
  singleQuote: true,
  tailwindAttributes: ['class', 'className'],
  tailwindFunctions: ['tw', 'twObject', 'twMerge', 'twJoin', 'twConsumeCssVar'],
} satisfies Config & PluginOptions;
