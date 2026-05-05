# Ollama Pool Gateway - Full Technical Context & Integration Guide

This document provides the complete architectural and technical context for the Ollama Pool Gateway. Use this to understand the system's full capabilities and integration patterns.

## 📌 Core Purpose
The Ollama Pool Gateway is a resilient, multi-tenant proxy layer designed to turn a collection of individual Ollama API keys into a high-availability, enterprise-grade AI service.

## 🚀 Advanced Capabilities (The "Magic" inside)

### 1. Transparent Failover & High Availability
- **Automatic 429 Handling**: When an upstream key returns a `429 Too Many Requests`, the gateway intercepts the error, marks that specific key for "cooldown", and instantly retries the request with the next available key.
- **Request Multiplexing**: A single client request can trigger multiple internal retries across different keys without the client ever knowing.

### 2. Intelligent Key Selection (Rotation)
- **Rotation Strategies**: Supports `round-robin` and `least-used` strategies to distribute load evenly and avoid hitting rate limits on any single key.
- **Health Monitoring**: A background cron job periodically "pings" all keys. Keys that fail are disabled or put in cooldown automatically.

### 3. Multi-Tenant Resource Management
- **Isolation**: Each tenant has their own API keys, usage history, and configuration.
- **Default Model Injection**: Tenants can set a `defaultModel` (e.g., `llama3.2`). If the client sends a request without the `model` parameter, the gateway injects the default dynamically.

### 4. Observability & Auditing
- **Token Estimation**: The gateway estimates input and output tokens for every request to provide cost/usage analysis.
- **Audit Logs**: Every request/response cycle is logged with:
  - Latency (ms)
  - Key used
  - Exact JSON payload
  - HTTP Status codes
  - Success/Retry/Failure status

## 🔗 Integration Specifications

### Authentication
- **System API Key**: Used for all `/api/*` programmatic calls.
- **Header**: `Authorization: Bearer <SYSTEM_API_KEY>`

### Primary Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/chat` | `POST` | Primary Chat API (Drop-in for Ollama). Supports `stream: true`. |
| `/api/models` | `GET` | Returns available models in the current key pool. |
| `/api/usage/stats` | `GET` | Returns tenant-specific usage statistics and performance. |

### Integration Rules for AI Assistants
1. **Model field is optional**: You can omit it if you want to use the tenant's global default.
2. **Handle 503/429 sparingly**: If the gateway returns a 429, it truly means the *entire pool* is exhausted.
3. **Base URL**: Defaults to `http://localhost:3333`.

## 🛠️ Error Normalization
- **`502 Bad Gateway`**: Upstream provider (Ollama Cloud) is unreachable or keys are invalid.
- **`503 Service Unavailable`**: No active keys available in the pool.
- **`401 Unauthorized`**: System API Key missing or invalid.
