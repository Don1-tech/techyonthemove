# Techy On The Move API

## Setup

Set `DATABASE_URL` and `BUSINESS_EMAIL` for the existing API. Apply migrations
before starting the service:

```sh
npm run migrate
npm run build
npm start
```

The public request flow uses:

- `POST /api/requests` to validate a request and send a phone code. This route
  no longer inserts a request before phone verification.
- `POST /api/requests/verification/verify` to create the request after a
  valid code.
- `POST /api/requests/verification/resend` to replace the code after the
  cooldown.
- `POST /api/requests/verification/cancel` to abandon the pending submission.

Public review submissions use `POST /api/reviews` to request a six-digit SMS
code, then `POST /api/reviews/verification/verify` to publish the review after
phone ownership and the matching service-request record have been verified.
The start endpoint returns the same status and response shape whether or not
the submitted name/phone pair matched a customer record.

Pending request details and keyed OTP digests are stored in PostgreSQL, never in
the browser. Run migrations `008_create_request_verifications.sql` and
`009_create_review_verifications.sql` on the same database used by every API
instance. Expired challenge details are scrubbed periodically; old challenge
records used for SMS-spending limits are deleted after 24 hours.

SMS controls include five messages per phone per day, a shared limit of 250
messages per day, per-IP challenge/message ceilings, route-level IP throttles,
a 60-second resend cooldown, and five code attempts per challenge.

The API trusts one reverse-proxy hop when resolving client IPs for rate
limiting, matching the Render-hosted API URL used by the frontend. If deployment
topology changes, update `trustProxy` to the exact trusted proxy count; do not
trust arbitrary forwarded headers from untrusted clients.

## SMS configuration

The SMS adapter uses Africa's Talking's SMS API and makes no live requests
unless the credentials are configured:

- `OTP_HMAC_SECRET`: a stable, random secret of at least 32 bytes shared by all
  backend instances. It keys OTP and contact-number digests.
- `AFRICASTALKING_USERNAME`
- `AFRICASTALKING_API_KEY`
- `AFRICASTALKING_ENVIRONMENT`: `sandbox` or `production`. The example uses
  `sandbox`; production SMS requires explicitly setting `production`.
- `AFRICASTALKING_SENDER_ID`: optional sender ID approved for the account.

Missing or invalid OTP secrets and missing SMS credentials disable only the
verification endpoints with a safe `503` response; they do not expose a
development OTP or create a permanent request. Configure the credentials in
the backend deployment's secret environment settings, never in Vite variables
or public frontend files. Use HTTPS for the deployed API. Automated tests use a
mock SMS transport and do not send messages.

The current backend has an admin-request notification, but no configured
customer request-confirmation email sender. The admin dashboard receives the
existing PostgreSQL insert notification when the request transaction commits;
the separate admin backend's realtime migration must remain applied to the
shared database. Configure a customer email integration if email confirmations
are required.