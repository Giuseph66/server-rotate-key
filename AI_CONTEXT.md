# Server Rotate Key - Full Technical Context & Integration Guide

This document provides the complete architectural and technical context for the **Server Rotate Key** gateway. Use this to understand the system's full capabilities and integration patterns.

## 📌 Core Purpose
The **Server Rotate Key** is a resilient, multi-tenant proxy layer designed to consolidate multiple AI providers (Ollama, ChatGPT/Codex) into a single, high-availability, enterprise-grade AI service. It handles the complexity of rate limits, key rotation, and provider failover transparently.

## 🚀 Advanced Capabilities (The Engine)

### 1. Multi-Provider Intelligence (Ollama + Codex)
- **Unified Interface**: A single API endpoint (`/api/chat`) that can route requests to different backends seamlessly.
- **ChatGPT Codex Integration**: Leverage ChatGPT models directly through the gateway by connecting your account.
- **Provider Switching**: Use the `provedor` parameter to force a specific backend (`ollama` or `codex`).

### 2. Transparent Failover & High Availability (Ollama)
- **Automatic 429 Handling**: When an Ollama key returns a `429 Too Many Requests`, the gateway intercepts the error, marks that specific key for "cooldown", and instantly retries the request with the next available key in the pool.
- **Request Multiplexing**: A single client request can trigger multiple internal retries across different keys without the client ever knowing.

### 3. Intelligent Model Management
- **Default Model Injection**: Tenants can set a `defaultModel` (e.g., `llama3.2` for Ollama or `GPT-5.5` for Codex). If the client sends a request without the `model` parameter, the gateway injects the correct default dynamically based on the active provider.
- **Unified Model Listing**: The `/api/models` endpoint aggregates available models from all active keys and connections.

### 4. Observability & Auditing
- **Real-time Metrics**: Track total requests, success rate, average latency, and auto-retry counts.
- **Usage Normalization**: All requests (including streaming) are logged and normalized to provide accurate stats on "Top Models" and activity patterns.

## 🔗 Integration Specifications

### Authentication
- **System API Key**: Used for all `/api/*` programmatic calls.
- **Header**: `Authorization: Bearer <YOUR_SYSTEM_API_KEY>`

### Primary Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/chat` | `POST` | Primary Chat API. Supports `stream: true` and `provedor` selection. |
| `/api/models` | `GET` | Returns available models across all active providers. |
| `/api/usage/stats` | `GET` | Returns detailed usage statistics for the current tenant. |

### Request Payload Example
```json
{
  "model": "llama3.2", // Optional (uses default if omitted)
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": false,
  "provedor": "ollama" // Optional: "ollama" | "codex"
}
```

## 🚨 Error Normalization
- **`429 Too Many Requests`**: Truly means the **entire** pool or provider connection is exhausted.
- **`502 Bad Gateway`**: Upstream provider is unreachable or key configuration is invalid.
- **`503 Service Unavailable`**: No active keys or connections available in the current pool.
- **`401 Unauthorized`**: System API Key is missing or invalid.

## 💡 Developer Tips
- **Provider Priority**: Set a `defaultProvider` in your profile to avoid sending the `provedor` field in every request.
- **Streaming**: Always use `ndjson` parsing for stream responses.
- **Security**: Never expose your System API Key in client-side code; always use it in backend-to-backend calls.
