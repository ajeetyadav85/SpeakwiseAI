# SpeakWise AI — AI Communication & Public Speaking Coach

SpeakWise AI is an enterprise-grade SaaS application designed to provide real-time speech coaching, low-latency live transcription, acoustic pitch/pace signal analysis, and personalized LLM feedback reports.

---

## 📄 Complete Software Architecture Specification

The complete production-ready software architecture document is available in:
👉 **[ARCHITECTURE.md](file:///c:/Users/Edunet Foundation/Desktop/speakwise-AI/ARCHITECTURE.md)**

It covers 30+ architectural dimensions including:
- **Project Vision & Target Personas**
- **Functional & Non-Functional Requirements**
- **User Journey & Screen Flow Diagrams (Mermaid)**
- **High-Level & Low-Level System Architecture**
- **MongoDB Database Schemas & ER Diagram**
- **REST API & WebSocket Framing Specification**
- **Security, Auth (JWT + OAuth2) & RBAC Matrix**
- **Real-Time Live Transcription & Audio Pipeline**
- **Acoustic Signal Processing & LLM Prompting Pipeline**
- **State Management (Zustand + TanStack Query)**
- **Caching (Redis L2 + Client L1) & Error Resilience**
- **Deployment Architecture, Environment Variables & Dev Roadmap**

---

## 📁 Repository Structure Overview

```
speakwise-AI/
├── ARCHITECTURE.md          # Exhaustive Software Architecture Specification
├── README.md                # Project Overview & Getting Started
├── .env.example             # Complete Environment Variables Matrix
├── docker-compose.yml       # Local MongoDB + Redis Services setup
├── client/                  # Next.js 14 Web Frontend Application (App Router)
└── server/                  # Node.js + TypeScript Backend API & WebSocket Gateway
```

---

## 🛠️ Infrastructure Setup

To start local MongoDB and Redis instances for development:

```bash
docker-compose up -d
```
