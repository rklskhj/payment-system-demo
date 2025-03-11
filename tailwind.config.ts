// /** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "ai-blue": "#0091FF",
        "ai-purple": "#B84FFF",
        "ai-pink": "#FF3D77",
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', "Pretendard" /* 기타 폴백 폰트 */],
      },
    },
  },
  plugins: [],
};
