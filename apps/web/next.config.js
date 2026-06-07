/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  async rewrites() {
    const backendHost = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
      : "http://localhost:4000";

    return [
      {
        source: "/proxy-api/:path*",
        destination: `${backendHost}/api/:path*`,
      },
      {
        source: "/proxy-health",
        destination: `${backendHost}/health`,
      }
    ];
  }
};

module.exports = nextConfig;
