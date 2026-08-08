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
    unoptimized: true,
  },
}

export default nextConfig
