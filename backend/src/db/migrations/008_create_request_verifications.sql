CREATE TABLE IF NOT EXISTS request_verifications (
    id UUID PRIMARY KEY,
    pending_request JSONB,
    phone_hash CHAR(64) NOT NULL,
    ip_hash CHAR(64) NOT NULL,
    otp_digest CHAR(64),
    expires_at TIMESTAMPTZ NOT NULL,
    next_resend_at TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0
        CHECK (attempt_count >= 0),
    resend_count INTEGER NOT NULL DEFAULT 0
        CHECK (resend_count >= 0),
    status VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
    request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
    idempotency_key UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_request_verification_data
        CHECK (
            (status = 'pending' AND pending_request IS NOT NULL AND otp_digest IS NOT NULL)
            OR status <> 'pending'
        )
);

CREATE INDEX IF NOT EXISTS idx_request_verifications_phone_created
ON request_verifications (phone_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_verifications_ip_created
ON request_verifications (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_verifications_created
ON request_verifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_verifications_expiry
ON request_verifications (expires_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_requests_phone_digits
ON requests (regexp_replace(phone, '[^0-9]', '', 'g'));
