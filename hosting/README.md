# Hosting Security Headers

The architecture package is a static site. Apply security headers at the hosting layer:

- Cloudflare Pages and Netlify can consume the repository-root `_headers` file.
- NGINX can include `hosting/nginx-security-headers.conf` from the site `server` or `location` block.
- Other hosts should map the same header names and values into their native configuration.

The Content Security Policy intentionally blocks third-party scripts, frames, forms, plugins, and remote network connections. Inline JavaScript is not allowed. Inline styles remain allowed because the Structurizr renderer calculates diagram geometry and tooltips through style attributes.

Do not add `unsafe-eval` to `script-src`. The included JointJS bundle contains a legacy global-object fallback using the `Function` constructor, but supported modern browsers resolve `globalThis` first and do not execute that fallback.

HSTS is intentionally absent from the reusable files. Add it only after confirming that the selected architecture hostname and any applicable subdomains are permanently HTTPS-only.
