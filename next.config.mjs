/** @type {import('next').NextConfig} */

// ─── Security Headers ─────────────────────────────────────────────────────────
//
// CSP NOTE: 'unsafe-inline' in script-src is required by Next.js 14 App Router,
// which injects inline <script> tags for __NEXT_DATA__ and RSC payloads.
// To harden this further, implement a nonce via middleware (next step after launch).
//
// img-src includes *.digitaloceanspaces.com for presigned URL redirects (307) that
// the browser follows directly when downloading or viewing files.
//
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is required by Next.js dev mode (webpack HMR / React Fast Refresh).
      // Omitting it causes an EvalError that aborts hydration, leaving the page non-functional.
      process.env.NODE_ENV === "development"
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.digitaloceanspaces.com",
      // Spaces en connect-src: los adjuntos de reclamos se suben con fetch PUT
      // directo del browser al bucket (presigned URLs).
      "connect-src 'self' https://*.digitaloceanspaces.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
