# Outlook Webhook Express API

## Overview

Lightweight Express API that manages Microsoft Graph subscriptions for Outlook email and handles webhook notifications. The service stores subscription metadata and extracted 6-digit codes in SQLite for auditing or follow-up automation.

## Features

- Subscription creation endpoint (`POST /subscribe`) for Outlook message creation events
- Webhook receiver (`POST /outlook/webhook`) that supports validation tokens and message notifications
- Fetches full messages via Microsoft Graph and parses 6-digit codes with `/\b\d{6}\b/`
- Persists subscriptions and parsed codes in SQLite using `better-sqlite3`
- TypeScript codebase with strict settings and ESM modules
- OpenAPI specification and Postman collection for quick onboarding

## Prerequisites

- Node.js 18 or later
- Microsoft 365 account with permissions to create Outlook subscriptions
- HTTPS endpoint reachable by Microsoft Graph (Azure tunnel, ngrok, etc.)

## Installation

```bash
npm install
```

## Configuration

Environment variables:

- `OUTLOOK_TOKEN` (required): Microsoft Graph delegated token with `Mail.Read` and `MailboxSettings.Read` (or equivalent). Renew before the 1-hour subscription expiration.
- `PORT` (optional): Server port. Defaults to `8080`.
- `OUTLOOK_DB_PATH` (optional): SQLite database path. Defaults to `./outlook.db`.

Set them locally:

```bash
set OUTLOOK_TOKEN=eyJhbGci...
set PORT=8080
set OUTLOOK_DB_PATH=C:\data\outlook.db
```

_Use `export` on macOS/Linux._

## Usage

```bash
npm start
```

The server logs `Server listening on port <port>` and creates the SQLite database if missing.

### Create Subscription

Request:

```http
POST /subscribe
Content-Type: application/json
Authorization: Bearer <OUTLOOK_TOKEN>

{
  "notificationUrl": "https://your-domain.example.com/outlook/webhook"
}
```

Response mirrors Microsoft Graph subscription payload and gets stored in SQLite.

### Webhook Handling

Microsoft Graph will:

1. Send a validation request with `validationToken`. The API echoes the token.
2. Send notifications with message metadata. The API fetches the message, extracts a 6-digit code (if any), logs it, and stores it in `message_codes`.

## Database

SQLite schema (`outlook.db` by default):

- `subscriptions`: Microsoft Graph subscription metadata
- `message_codes`: Message subject, extracted code, and timestamps

Inspect the database using tools like `sqlite3` CLI or `DB Browser for SQLite`.

## API Documentation

- `openapi.yaml`: Comprehensive OpenAPI 3.1 specification
- `postman_collection.json`: Import in Postman for sample requests

## Development

- Type checking: `npm run typecheck`
- Format/lint: not included; integrate prefered tooling as needed

## Deployment Notes

- Host behind HTTPS with a publicly accessible URL (`notificationUrl`)
- Rotate `OUTLOOK_TOKEN` or exchange refresh tokens programmatically to keep subscriptions active
- Monitor database size or archive entries periodically

## Troubleshooting

- `Missing OUTLOOK_TOKEN`: Set the environment variable before starting the server
- `400 Bad Request` from `/subscribe`: Double-check `notificationUrl` and Graph token scopes
- No 6-digit code logged: Ensure the message contains a code matching `/\b\d{6}\b/`

## Resources

- [Microsoft Graph Webhooks](https://learn.microsoft.com/graph/webhooks)
- [Outlook Mail API reference](https://learn.microsoft.com/graph/api/resources/mail-api-overview)

<!-- end -->