-- =========================================================
-- TECHY ON THE MOVE
-- ADMIN REALTIME NOTIFICATIONS
--
-- This migration makes PostgreSQL notify the separate admin
-- backend whenever a request is inserted or its status changes.
--
-- The customer backend does NOT need to know about WebSockets.
-- PostgreSQL becomes the event source.
-- =========================================================

CREATE OR REPLACE FUNCTION notify_techy_request_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  payload JSON;
BEGIN
  IF TG_OP = 'INSERT' THEN

    payload := json_build_object(
      'event', 'created',
      'request', json_build_object(
        'id', NEW.id,
        'reference', NEW.reference,
        'serviceId', NEW.service_id,
        'issueId', NEW.issue_id,
        'issueDetails', NEW.issue_details,
        'fullName', NEW.full_name,
        'phone', NEW.phone,
        'email', NEW.email,
        'location', NEW.location,
        'directions', NEW.directions,
        'requestedDate', NEW.requested_date,
        'requestedTime', TO_CHAR(NEW.requested_time, 'HH24:MI'),
        'status', NEW.status,
        'createdAt', NEW.created_at,
        'updatedAt', NEW.updated_at,
        'approximatePrice', NEW.approximate_price
      )
    );

  ELSIF TG_OP = 'UPDATE' THEN

    IF OLD.status IS DISTINCT FROM NEW.status THEN

      payload := json_build_object(
        'event', 'updated',
        'request', json_build_object(
          'id', NEW.id,
          'reference', NEW.reference,
          'serviceId', NEW.service_id,
          'issueId', NEW.issue_id,
          'issueDetails', NEW.issue_details,
          'fullName', NEW.full_name,
          'phone', NEW.phone,
          'email', NEW.email,
          'location', NEW.location,
          'directions', NEW.directions,
          'requestedDate', NEW.requested_date,
          'requestedTime', TO_CHAR(NEW.requested_time, 'HH24:MI'),
          'status', NEW.status,
          'createdAt', NEW.created_at,
          'updatedAt', NEW.updated_at,
          'approximatePrice', NEW.approximate_price
        )
      );

    ELSE
      RETURN NEW;
    END IF;

  ELSE
    RETURN NEW;
  END IF;

  PERFORM pg_notify(
    'techy_requests',
    payload::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_techy_request_realtime
ON requests;

CREATE TRIGGER trg_techy_request_realtime
AFTER INSERT OR UPDATE OF status
ON requests
FOR EACH ROW
EXECUTE FUNCTION notify_techy_request_change();