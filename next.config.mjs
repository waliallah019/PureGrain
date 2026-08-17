/** @type {import('next').NextConfig} */
const nextConfig = {
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
     * `unoptimized: true` was a leftover from the v0.dev scaffold. It disabled
     * Next's image optimizer entirely, which is the actual root cause of two
     * findings in the SEO audit:
     *   - "All images served as JPEG/PNG — should be WebP"
     *   - a large share of the 4.4s load time (hero JPEGs are 300–430KB each and
     *     were being served at full size to every device)
     *
     * With it off, <Image> now emits a responsive srcset in AVIF/WebP. There is
     * no `output: "export"` in this config, so nothing required it to be on.
     *
     * `sharp` is a devDependency and is what Next uses to do the transcoding —
     * keep it installed or production builds fall back to a much slower path.
     */
    formats: ["image/avif", "image/webp"],
    /*
     * Every remote image in the database is Cloudinary (verified across
     * raw-leather, finished-products and blogs — 523 URLs, all
     * res.cloudinary.com). Any host NOT listed here will throw at runtime when
     * passed to <Image>, so add new CDNs before using them.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Product photography is immutable once uploaded (Cloudinary versions URLs),
    // so cache the optimized variants for a month instead of the 60s default.
    minimumCacheTTL: 2592000,
  },
}

export default nextConfig
