# SpeakWise AI — Environment Variables Specification

This document provides detailed descriptions and security requirements for all environment variables used across SpeakWise AI.

---

## Server Environment Variables (`server/.env`)

| Variable Name | Required | Default / Format | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` / `production` | Execution environment mode. |
| `PORT` | Yes | `5000` | HTTP port for Express backend server. |
| `API_PREFIX` | Yes | `/api/v1` | Base URL prefix for all REST endpoints. |
| `CORS_ORIGIN` | Yes | `http://localhost:3000` | Allowed origin header for CORS requests. |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/speakwise_db` | Connection string for MongoDB primary database. |
| `REDIS_HOST` | Yes | `127.0.0.1` | Redis host for caching, BullMQ, and rate limiting. |
| `REDIS_PORT` | Yes | `6379` | Redis TCP port. |
| `JWT_ACCESS_SECRET` | Yes | `min 32 chars string` | Cryptographic secret for signing short-lived JWT access tokens. |
| `JWT_REFRESH_SECRET`| Yes | `min 32 chars string` | Cryptographic secret for signing long-lived refresh tokens. |
| `OPENAI_API_KEY` | Optional | `sk-proj-xxx` | OpenAI API key for Whisper STT and GPT-4o evaluation. |
| `GEMINI_API_KEY` | Optional | `AIzaSy-xxx` | Google Gemini API key for cost-optimized speech reasoning. |

---

## Client Environment Variables (`client/.env`)

| Variable Name | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | `/api/v1` | Backend REST API base URL for Axios client. |
| `VITE_SOCKET_URL` | Yes | `http://localhost:5000` | Socket.IO server URL for live audio streaming. |
