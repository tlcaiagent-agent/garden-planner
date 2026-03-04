import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          dark: '#2D5016',
          green: '#4A7C2E',
          light: '#6B9B4E',
          lime: '#8BC34A',
          brown: '#8B6914',
          earth: '#A67C52',
          cream: '#FFF8E7',
          sand: '#F5E6C8',
          warmWhite: '#FFFDF5',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['system-ui', 'sans-serif'],
      },
      boxShadow: {
        'garden': '0 4px 20px rgba(45, 80, 22, 0.15)',
        'garden-lg': '0 8px 40px rgba(45, 80, 22, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config
