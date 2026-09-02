import type { NextConfig } from "next";

const githubPagesBuild = process.env.GITHUB_PAGES === "true";
const githubRepositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "iim-admission-predictor";
const githubBasePath = githubPagesBuild ? `/${githubRepositoryName}` : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  ...(githubPagesBuild ? {
    output: "export" as const,
    basePath: githubBasePath,
    assetPrefix: githubBasePath,
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
  // Keep local hot-reload files separate from production builds so a build
  // cannot invalidate the browser's active development chunks.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
