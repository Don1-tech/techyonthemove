ALTER TABLE request_verifications
    ALTER COLUMN phone_hash DROP NOT NULL,
    ALTER COLUMN ip_hash DROP NOT NULL;

ALTER TABLE review_verifications
    ALTER COLUMN phone_hash DROP NOT NULL,
    ALTER COLUMN ip_hash DROP NOT NULL;

UPDATE request_verifications
SET status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END,
    pending_request = NULL,
    phone_hash = NULL,
    ip_hash = NULL,
    otp_digest = NULL,
    idempotency_key = NULL;

UPDATE review_verifications
SET status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END,
    pending_review = NULL,
    phone_hash = NULL,
    ip_hash = NULL,
    otp_digest = NULL,
    sms_attempted = FALSE;

CREATE TABLE IF NOT EXISTS submission_idempotency (
    idempotency_key UUID PRIMARY KEY,
    payload_hash CHAR(64) NOT NULL,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_submission_idempotency_target
        CHECK (num_nonnulls(request_id, review_id) = 1)
);

CREATE INDEX IF NOT EXISTS idx_submission_idempotency_created_at
    ON submission_idempotency (created_at);
