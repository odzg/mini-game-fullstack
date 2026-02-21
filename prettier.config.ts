import type { Config } from 'prettier';

export default {
  plugins: ['prettier-plugin-tailwindcss'],
  singleQuote: true,
  tailwindAttributes: ['class', 'className'],
  tailwindFunctions: ['tw', 'twObject', 'twMerge', 'twJoin', 'twConsumeCssVar'],
} satisfies Config;
