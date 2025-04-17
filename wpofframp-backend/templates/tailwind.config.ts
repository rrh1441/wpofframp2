// templates/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
       typography: ({ theme }: { theme: any }) => ({ // Add Tailwind Typography plugin setup
                DEFAULT: {
                  css: {
                    '--tw-prose-body': theme('colors.gray[700]'),
                    '--tw-prose-headings': theme('colors.gray[900]'),
                    '--tw-prose-lead': theme('colors.gray[600]'),
                    '--tw-prose-links': theme('colors.blue[600]'),
                    '--tw-prose-bold': theme('colors.gray[900]'),
                    '--tw-prose-counters': theme('colors.gray[500]'),
                    '--tw-prose-bullets': theme('colors.gray[300]'),
                    '--tw-prose-hr': theme('colors.gray[200]'),
                    '--tw-prose-quotes': theme('colors.gray[900]'),
                    '--tw-prose-quote-borders': theme('colors.gray[200]'),
                    '--tw-prose-captions': theme('colors.gray[500]'),
                    '--tw-prose-code': theme('colors.indigo[600]'),
                    '--tw-prose-pre-code': theme('colors.indigo[900]'),
                    '--tw-prose-pre-bg': theme('colors.gray[100]'),
                    '--tw-prose-th-borders': theme('colors.gray[300]'),
                    '--tw-prose-td-borders': theme('colors.gray[200]'),
                    // Add dark mode prose if needed
                    // '--tw-prose-invert-body': theme('colors.gray[300]'),
                   },
                },
              }),
    },
  },
  plugins: [
      require('@tailwindcss/typography'), // Add the typography plugin
      require("tailwindcss-animate")
    ],
};
export default config;