import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      config.module.rules.push({
        test: /\.js$/,
        include: /node_modules\/@mediapipe/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      });
    }

    return config;
  },
  transpilePackages: [
    "@mediapipe/holistic",
    "@mediapipe/camera_utils",
    "@mediapipe/drawing_utils",
  ],
  // Ensure proper asset handling for MediaPipe
  assetPrefix: process.env.NODE_ENV === "production" ? "/" : "",
};

export default nextConfig;
