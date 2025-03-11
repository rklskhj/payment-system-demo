/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    outputFileTracingExcludes: {
      "*": ["**/*.js.map", "**/*.d.ts", ".next/trace"],
    },
  },
  images: {
    domains: ["example.com"],
  },
};

module.exports = nextConfig;
