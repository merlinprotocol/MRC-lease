/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // webpack: {
  //   test: /\.svg$/,
  //   use: ["@svgr/webpack"],
  // },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/app',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
