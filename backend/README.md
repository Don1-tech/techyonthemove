# Techy On The Move API

## Setup

Configure `DATABASE_URL`, `BUSINESS_EMAIL`, and the Turnstile settings below.
Apply the database migrations before starting the API:

```sh
npm run migrate
npm run build
npm start
```

Public submissions are protected by server-side Cloudflare Turnstile
verification:

- `POST /api/requests` verifies the token, validates service and availability,
  then persists the request and submission idempotency record in one
  transaction.
- `POST /api/reviews` verifies the token, checks the submitted name against an
  existing service request, then persists the review and idempotency record in
  one transaction.
- Both routes have a limit of three submissions per IP per 15 minutes. The API
  also has a general request limit.
- Review name matching is an eligibility check only. Turnstile helps reduce
  automated abuse but neither control authenticates a customer's identity.
- Idempotency records are retained for 24 hours and expired records are removed
  during public submission processing; the saved request and review records are
  not removed with them.

The API requires `TURNSTILE_SECRET_KEY`. It fails closed and returns a safe
`503` response if the key is missing or Cloudflare Siteverify is unavailable.
Set `TURNSTILE_ALLOWED_HOSTNAMES` to a comma-separated list of exact allowed
hostnames. Leave it empty only if hostname enforcement is intentionally
handled by the Turnstile widget configuration.

## Cloudflare Turnstile configuration

1. Create a Turnstile widget in Cloudflare and allow each intended hostname,
   including local development (for example, `localhost`) and the production
   custom domain used by Cloudflare Pages.
2. Configure the widget's **site key** as `VITE_TURNSTILE_SITE_KEY` in the
   frontend's local `.env` and in Cloudflare Pages' build environment. The
   value is public and is expected to be included in the frontend build.
3. Configure the matching **secret key** as `TURNSTILE_SECRET_KEY` in the
   backend's local environment and production secret settings. Never configure
   it as a `VITE_` variable or in Cloudflare Pages.
4. Configure `TURNSTILE_ALLOWED_HOSTNAMES` in the backend to the exact
   hostnames permitted by the widget. Include every legitimate deployment
   hostname that serves the public site.
5. Rebuild and redeploy the frontend after changing its site key. Configure
   production keys and hostnames only in their respective deployment
   environments; do not commit secret values.

For local development, set both local keys and allow `localhost` in the
Turnstile widget and backend hostname list. A valid widget site key and its
corresponding secret are required; the application does not bypass verification
when configuration is missing.

Migration `010_public_submission_idempotency.sql` adds idempotency storage,
cancels pending OTP challenges, and scrubs temporary challenge payloads,
digests, and phone/IP hashes from all legacy challenge records. Migrations
`008` and `009` remain in migration history; their now-unused tables are
retained with only non-sensitive historical metadata. The migration does not
delete requests, reviews, customer records, or admin data. Rolling back the new
idempotency table does not reactivate old challenges.

The booking request transaction preserves the existing PostgreSQL availability
constraint and admin notification trigger. The backend does not currently
send a customer request-confirmation email.

The trust proxy setting is limited to one reverse-proxy hop for client-IP rate
limiting. If the deployment topology changes, update it to the exact trusted
proxy count rather than trusting arbitrary forwarded headers.
