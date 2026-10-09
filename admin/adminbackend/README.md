# Techy On The Move Admin Backend

Separate admin/operations API for the Techy On The Move admin frontend.

It uses the SAME PostgreSQL database as the customer backend.

## Responsibilities

- Read requests from `requests`
- Filter requests by status
- Search request history
- Read a single request
- Change request status
- Receive PostgreSQL `NOTIFY` events
- Broadcast new-request events to connected admin browsers through WebSocket

## Run

1. Copy `.env.example` to `.env`
2. Put the same PostgreSQL connection information used by the main backend in `DATABASE_URL`
3. Run the notification migration against `techy_on_the_move`
4. Run `npm install`
5. Run `npm run dev`

The admin API runs on port 4100 by default.

## WebSocket

`ws://localhost:4100/ws/requests`

When a new request is inserted into PostgreSQL, connected admin clients receive:

{
  "type": "request.created",
  "request": { ... }
}

Status updates also produce:

{
  "type": "request.updated",
  "request": { ... }
}
