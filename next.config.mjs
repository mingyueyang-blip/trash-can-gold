/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开发时减少监听文件数，缓解 EMFILE (too many open files) 导致的 500
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**"],
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
