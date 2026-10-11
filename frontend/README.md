# Frontend

React 19 and Vite frontend for Techy On The Move. See the repository
[setup guide](../README.md) for local development and production configuration.

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend API
origin and `VITE_TURNSTILE_SITE_KEY` to the public site key for your Cloudflare
Turnstile widget. The site key is public; never put the Turnstile secret in a
frontend variable. Configure the same site key in Cloudflare Pages build
settings for production and rebuild after changing it. The widget must allow
the local development and production hostnames used by the site.

Configure the matching `TURNSTILE_SECRET_KEY` and the comma-separated
`TURNSTILE_ALLOWED_HOSTNAMES` on the backend only. See the [backend setup
guide](../backend/README.md#cloudflare-turnstile-configuration) for the full
Cloudflare and deployment setup. Protected public submissions fail closed if
server verification is not configured or temporarily unavailable.

Commands:

```powershell
npm ci
npm run dev
npm run build
npm run lint
```
