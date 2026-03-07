/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply CORS headers required for Solana Actions / Blinks
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, Accept-Encoding",
          },
          // Solana Actions registry header
          { key: "X-Action-Version", value: "1" },
          { key: "X-Blockchain-Ids", value: "solana:devnet" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
