# Ollama Pool Gateway

A multi-tenant API gateway that manages a rotating pool of Ollama Cloud API keys. Designed to ensure high availability and bypass rate limits (429 Too Many Requests) through automatic failover and intelligent key rotation.

## Features

- **Automatic Failover:** When a key hits a 429 Rate Limit, the gateway automatically rotates to the next available key and retries the request without dropping the connection.
- **Cooldown Management:** Rate-limited keys are placed in "Cooldown" for a configurable time before being returned to the active pool.
- **Multi-Tenancy:** Supports multiple tenants using the same gateway, each with independent JWT authentication.
- **Usage Tracking:** Tracks total requests, latency, success rates, and token estimates per tenant and per key.
- **Admin Dashboard:** Modern React/Vite UI to monitor health, manage the key pool, and test the gateway.
- **Drop-in Replacement:** Compatible with existing applications using the standard Ollama API (`/api/chat`, `/api/generate`, `/api/tags`).

## Architecture

Client -> Gateway (NestJS) -> [Pool of API Keys] -> Ollama Cloud

- **Backend:** Node.js + NestJS + SQLite (Prisma ORM)
- **Frontend:** React + Vite + TailwindCSS v4 + Recharts

## Quick Start (Local Development)

### 1. Install Dependencies
From the root directory, run:
\`\`\`bash
npm run install:all
\`\`\`

### 2. Setup the Database
The project uses a local SQLite database (\`database.db\`). Initialize it and seed the default users:
\`\`\`bash
npm run db:migrate
npm run db:seed
\`\`\`

*This will create an Admin user (`admin` / `admin123`) and a Demo user (`demo` / `demo123`).*

### 3. Start the Application
Run both the frontend and backend simultaneously:
\`\`\`bash
npm run dev
\`\`\`

The applications will be available at:
- **Frontend UI:** http://localhost:5173
- **Backend API:** http://localhost:3333
- **API Swagger Docs:** http://localhost:3333/docs

## How to Test the Key Rotation

1. Go to the **Frontend Dashboard** (http://localhost:5173) and log in with `admin` / `admin123`.
2. Navigate to the **API Keys** page.
3. Click **Add Key** and enter a valid Ollama Cloud API Key (or a fake one to see how errors are handled). Add at least two keys.
4. Navigate to the **Playground** page.
5. Send a message in the chat interface. You will see the **Gateway Routing Log** on the right side.
6. The gateway will try the first key. If it succeeds, it returns the response. If the key is exhausted (429), the log will show the key moving to cooldown and the system automatically trying the second key.

## Integrating with your Apps

You can use the gateway exactly like you use the standard Ollama API. Just point the base URL to \`http://localhost:3333\` and add the Bearer Token.

\`\`\`bash
curl -X POST http://localhost:3333/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TENANT_JWT_TOKEN" \\
  -d '{
    "model": "llama3.2",
    "messages": [
      { "role": "user", "content": "Hello!" }
    ],
    "stream": false
  }'
\`\`\`

*Note: You can get your Tenant JWT Token from the Network tab in your browser when logged into the Dashboard, or by calling `/api/auth/login`.*
# ollama-server-rotate-key
