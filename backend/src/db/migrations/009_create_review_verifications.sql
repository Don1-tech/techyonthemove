CREATE TABLE IF NOT EXISTS review_verifications (
    id UUID PRIMARY KEY,
    pending_review JSONB,
    phone_hash CHAR(64) NOT NULL,
    ip_hash CHAR(64) NOT NULL,
    otp_digest CHAR(64),
    expires_at TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0
        CHECK (attempt_count >= 0),
    sms_attempted BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_review_verification_data
        CHECK (
            (status = 'pending' AND pending_review IS NOT NULL AND otp_digest IS NOT NULL)
            OR status <> 'pending'
        )
);

CREATE INDEX IF NOT EXISTS idx_review_verifications_phone_created
ON review_verifications (phone_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_verifications_ip_created
ON review_verifications (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_verifications_expiry
ON review_verifications (expires_at)
WHERE status = 'pending';
