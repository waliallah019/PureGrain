/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * llms.txt is a Markdown document (llmstxt.org). Served from public/ it would
   * inherit `text/plain` from the .txt extension, so declare the real type.
   * `Vary: Accept` is set for consistency with the negotiated page responses —
   * this file has one representation, but advertising the header keeps shared
   * caches keyed the same way across the whole origin.
   */
  async headers() {
    return [
      {
        source: "/llms.txt",
        headers: [
          { key: "Content-Type", value: "text/markdown; charset=utf-8" },
          { key: "Vary", value: "Accept, Accept-Encoding" },
        ],
      },
    ]
  },
  eslint: {
    // ESLint is not yet configured in this project (no .eslintrc). Once a config
    // is added (`next lint` → Strict) and existing findings are resolved, flip
    // this to `false` so lint errors block the build.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors now block the build. The codebase is clean under
    // `tsc --noEmit` (also exposed as the `typecheck` npm script). Do not set
    // this back to `true` — it would silently re-hide type regressions.
    ignoreBuildErrors: false,
  },
  images: {
    /*
     * Vercel's optimizer is bypassed with a custom loader: the Hobby quota was
     * exhausted and `/_next/image` returned 402 for every uncached variant.
     * Cloudinary now does the resizing/AVIF/WebP; /public files are served
     * statically. See lib/image-loader.ts and CLOUDINARY_IMAGE_MIGRATION.md.
     */
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    /*
     * Each width a page can request is a separate Cloudinary derivative per
     * image and format, and those count against the plan's monthly credits.
     * Next's defaults (16 widths up to 3840) would put the site back on course
     * for the quota problem this loader exists to escape, so keep this short.
     * 1920 is the ceiling because no site image needs more at these layouts.
     */
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    /*
     * Every remote image in the database is on this Cloudinary cloud (verified
     * across raw-leather, finished-products and blogs). The custom loader does
     * not enforce this list; it applies if the default loader is ever restored.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/da1coaysi/**",
      },
    ],
  },
}

export default nextConfig
