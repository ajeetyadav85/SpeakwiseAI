# SpeakWise AI — Software Architecture Specification & System Design

---

## Executive Summary & System Vision

**SpeakWise AI** is an enterprise-grade, real-time AI Communication & Public Speaking Coach SaaS platform. It leverages low-latency audio streaming, acoustic signal processing, live automatic speech recognition (ASR), and advanced Large Language Model (LLM) feedback engines to evaluate, score, and coach speakers on fluency, pace, pitch modulation, vocabulary, filler word usage, emotional tone, and body posture.

### Business Vision & Goals
1. **Democratize High-Stakes Public Speaking Coaching**: Provide accessible, instant, non-judgmental executive-level speech coaching to professionals, educators, salespeople, and students.
2. **Measurable Skill Enhancement**: Increase speaker clarity, baseline confidence, and engagement metrics by 45%+ over a 6-week structured coaching curriculum.
3. **Enterprise SaaS Monetization**: Multi-tenant architecture serving B2C Pro subscribers, B2B Enterprise teams (sales, customer success, leadership development), and Educational Institutions.

---

## Target Audience & Detailed User Personas

| Persona ID | Role / Target User | Primary Pain Points | Key Goals & Needs |
| :--- | :--- | :--- | :--- |
| **P-01: Executive Elena** | C-Level Executive / VP | Limited time for human speech coaching, high anxiety in investor keynotes, needs confidential feedback. | Instant post-rehearsal reports, pitch modulation analytics, executive presence scoring. |
| **P-02: Sales Rep Sam** | SDR / Account Executive | High usage of filler words ("um", "ah", "like"), poor pacing during objection handling. | Real-time pacing cues, objection rehearsal simulation, team leaderboard & performance tracking. |
| **P-03: ESL Learner Lin** | Non-native English Speaker | Pronunciation anxiety, monotone pitch, difficulty finding complex business vocabulary. | Pronunciation breakdown, vocabulary enrichment recommendations, native cadence matching. |
| **P-04: Campus Chris** | University Student | Presentation panic, speaking too fast (200+ WPM), unengaging slides. | Practice mode with teleprompter, slide-by-slide speech timing, budget-friendly tier. |

---

## Requirements Specification

### Functional Requirements (FR)

```
[FR-01] Real-Time Audio Recording & WebRTC/WebSocket Streaming
[FR-02] Live Automatic Speech Recognition (ASR) & Real-Time Transcript Display (<300ms latency)
[FR-03] Live Teleprompter & Pace Feedback Cues (Slow down / Speed up / High filler warning)
[FR-04] Post-Speech Acoustic Signal Analysis (Pace WPM, Pitch Range, Volume Dynamics, Pause Intervals)
[FR-05] Filler Word & Speech Disfluency Detection (Count, Frequency, Timestamped Markers)
[FR-06] LLM-Powered Comprehensive Speech Evaluation (Clarity, Persuasiveness, Tone, Structure)
[FR-07] Actionable Practice Recommendations & Custom Exercises (Drills for Pauses, Vocal Variety)
[FR-08] Interactive Speech Report Dashboard (Radar charts, Audio playback synchronized with transcript)
[FR-09] User Rehearsal History, Trend Tracking & Goal Setting
[FR-10] Multi-Tenant Enterprise Teams (Role-Based Access Control, Shared Rehearsal Vaults, Team Benchmarks)
[FR-11] Subscription & Usage Management (Stripe Billing, Tokens/Minutes Quota Enforcement)
```

### Non-Functional Requirements (NFR)

```
[NFR-01] Performance: Real-time transcript latency <300ms; Post-speech report generation <3.5 seconds.
[NFR-02] Scalability: Horizontally scalable microservices supporting 10,000+ concurrent WebSocket speech streams.
[NFR-03] Reliability: 99.9% uptime SLA with automatic WebSocket fallback and offline chunk buffering.
[NFR-04] Security: End-to-end TLS 1.3 encryption, AES-256 for audio at rest, SOC2 Type II and GDPR compliant.
[NFR-05] Audio Quality: Support 16kHz to 48kHz mono/stereo PCM WebM/WAV audio streams.
[NFR-06] Usability: Mobile-responsive UI with smooth 60fps waveform visualization and dark mode default.
```

---

## End-to-End User Journey & Complete Application Flow

```mermaid
flowchart TD
    A[User Arrives / Landing Page] --> B{Authenticated?}
    B -- No --> C[Auth / Register Page]
    C --> D[Email/Password or OAuth2 Login]
    D --> E[Multi-Factor Authentication / JWT Issued]
    B -- Yes --> F[User Dashboard]
    
    F --> G[Select Practice Mode]
    G --> H1[Free Rehearsal Mode]
    G --> H2[Structured Course / Scenario Drill]
    G --> H3[Live Teleprompter Mode]
    
    H1 & H2 & H3 --> I[Microphone & Audio Input Test]
    I --> J[Click 'Start Recording']
    
    J --> K[Real-Time Streaming Session]
    K --> K1[Audio Chunking Web Worker - 100ms PCM]
    K1 --> K2[WebSocket Transport to Backend Gateway]
    K2 --> K3[Live ASR STT Engine]
    K3 --> K4[Push Live Transcript & Visual Pacing Alerts to UI]
    
    J --> L[Click 'Stop Session']
    L --> M[Audio Finalization & Upload to S3 Bucket]
    
    M --> N[Async Processing Worker Pipeline]
    N --> N1[Acoustic Processing: Pitch, WPM, Pauses, Energy]
    N --> N2[NLP & Disfluency Processing: Filler Words, Grammar]
    N --> N3[LLM Engine: Qualitative Scoring & Suggestions]
    
    N1 & N2 & N3 --> O[Store Synthesis Report in MongoDB & Cache in Redis]
    O --> P[Redirect User to Interactive Speech Report Page]
    P --> Q[Review Metrics, Synchronized Audio Playback & Practice Drills]
```

---

## Screen Flow Diagram & UI Architecture

```mermaid
graph TD
    S0[Landing Page / Marketing] --> S1[Auth Portal: Login / Register]
    S1 --> S2[Main Dashboard Overview]
    
    S2 --> S3[Session Studio / Rehearsal Hub]
    S2 --> S4[Session Analytics & History]
    S2 --> S5[Curriculum & Guided Drills]
    S2 --> S6[Team Workspace / B2B Admin]
    S2 --> S7[User Settings & Billing]
    
    S3 --> S3_1[Microphone Calibration Modal]
    S3_1 --> S3_2[Live Practice HUD]
    S3_2 --> S3_3[Processing Overlay / Loader]
    S3_3 --> S8[Detailed Speech Analysis Report]
    
    S4 --> S8
    S8 --> S8_1[Audio Playback & Waveform View]
    S8 --> S8_2[Transcript & Filler Word Inspector]
    S8 --> S8_3[Vocal Variety & Pitch Graphs]
    S8 --> S8_4[AI Coach Re-write Suggestions]
    S8 --> S8_5[Export PDF / Share Report]
```

---

## High-Level & Low-Level System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph Client Layer
        WebClient[Next.js 14 Web Client]
        MobileClient[React Native / Web PWA]
    end

    subgraph API & Edge Network
        Cloudflare[Cloudflare Edge CDN & WAF]
        Kong[Kong API Gateway / Nginx Ingress]
    end

    subgraph Application Tier
        AuthService[Auth & User Service]
        SessionService[Session Core Service]
        BillingService[Stripe Billing Service]
        NotificationService[Notification Engine]
    end

    subgraph Real-Time & Audio Processing Engine
        WSServer[WebSocket Audio Gateway Node Cluster]
        SpeechWorker[BullMQ Audio Processing Worker Pool]
        AcousticEngine[Python Acoustic Signal Engine - Librosa/Praat]
    end

    subgraph AI Infrastructure
        STTProvider[Live STT: Deepgram / Whisper Stream]
        LLMProvider[LLM Engine: GPT-4o / Claude 3.5 Sonnet]
    end

    subgraph Data & Storage Tier
        MongoDB[(MongoDB Primary Cluster)]
        RedisCache[(Redis Sentinel / Cluster)]
        S3Storage[(AWS S3 Audio & PDF Storage)]
    end

    WebClient & MobileClient --> Cloudflare
    Cloudflare --> Kong
    Kong --> AuthService
    Kong --> SessionService
    Kong --> BillingService
    Kong --> WSServer

    WSServer <--> STTProvider
    WSServer --> S3Storage
    WSServer --> SpeechWorker

    SpeechWorker <--> AcousticEngine
    SpeechWorker <--> LLMProvider
    SpeechWorker --> MongoDB
    SpeechWorker --> RedisCache
```

### Low-Level Speech & AI Analysis Pipeline Architecture

```mermaid
sequenceDiagram
    autonumber
    participant UI as Client Web Audio HUD
    participant WS as WebSocket Gateway
    participant STT as Live STT Engine (Deepgram/Whisper)
    participant Queue as BullMQ Job Queue
    participant Worker as Speech Processing Worker
    participant Signal as Python Acoustic Service
    participant LLM as OpenAI GPT-4o Service
    participant DB as MongoDB / S3
    
    UI->>WS: Initialize WebSocket Connection (Auth Token + Session Config)
    WS-->>UI: Session Acknowledged (Stream Ready)
    
    loop Real-Time Streaming (Every 100ms)
        UI->>WS: Send Binary Audio Frame (PCM WebM)
        WS->>STT: Forward Audio Stream
        STT-->>WS: Partial / Final Transcript Event + Timestamps
        WS-->>UI: Real-Time Transcript + Live WPM & Filler Cues
    end
    
    UI->>WS: Send Event 'STOP_SESSION'
    WS->>S3: Upload Full Raw Audio File (.webm / .wav)
    WS->>Queue: Push 'PROCESS_SPEECH_REPORT' Job (SessionID, S3_URL)
    WS-->>UI: Session Stopped -> Show Progress HUD
    
    Queue->>Worker: Consume 'PROCESS_SPEECH_REPORT'
    Worker->>Signal: POST /analyze-acoustics (Download S3 Audio)
    Note over Signal: Compute Pitch Modulation, dB Energy,<br/>Pauses, Vocal Fry & Pace Variations
    Signal-->>Worker: Return Acoustic Metrics JSON
    
    Worker->>LLM: POST /v1/chat/completions (Full Transcript + Acoustic Metrics)
    Note over LLM: Evaluate Rhetorical Structure, Tone,<br/>Clarity, Executive Presence & Key Takeaways
    LLM-->>Worker: Return Structured JSON Feedback Schema
    
    Worker->>DB: Save SpeechSession Document (Metrics, Transcript, AI Analysis)
    Worker->>Redis: Invalidate User Dashboard Caches
    Worker-->>UI: Push Socket Event 'REPORT_READY' (SessionID)
```

---

## Complete Project Folder Structure (Frontend + Backend)

```
speakwise-AI/
├── ARCHITECTURE.md
├── README.md
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── .gitignore
│
├── client/                             # Next.js 14 Frontend Application
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── audio-worklets/             # AudioWorkletProcessors for smooth background PCM streaming
│   │       ├── pcm-processor.js
│   │       └── vad-processor.js
│   ├── src/
│   │   ├── app/                        # Next.js App Router Structure
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reset-password/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── studio/
│   │   │   │   │       └── page.tsx    # Live Recording Studio HUD
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── courses/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── team/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── api/                    # Next.js BFF (Backend For Frontend) proxy routes if needed
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # High-converting SaaS Landing Page
│   │   │   ├── global-error.tsx
│   │   │   └── not-found.tsx
│   │   ├── components/                 # Atomic Component Design
│   │   │   ├── ui/                     # Design System Elements (Button, Card, Modal, Input, Badge)
│   │   │   ├── audio/                  # Audio Visualizers, Mic Test Selector, Waveform Player
│   │   │   │   ├── AudioWaveform.tsx
│   │   │   │   ├── MicSelector.tsx
│   │   │   │   ├── PitchChart.tsx
│   │   │   │   └── VolumeMeter.tsx
│   │   │   ├── live-studio/            # Studio HUD components
│   │   │   │   ├── Teleprompter.tsx
│   │   │   │   ├── PaceGauge.tsx
│   │   │   │   ├── LiveTranscript.tsx
│   │   │   │   └── FillerAlertBadge.tsx
│   │   │   ├── report/                 # Report Dashboard components
│   │   │   │   ├── ExecutiveSummaryCard.tsx
│   │   │   │   ├── MetricsRadarChart.tsx
│   │   │   │   ├── SynchronizedTranscript.tsx
│   │   │   │   └── PracticeDrillsCard.tsx
│   │   │   ├── dashboard/              # User Dashboard Components
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── RecentSessionsTable.tsx
│   │   │   │   └── GoalProgressWidget.tsx
│   │   │   └── layout/                 # Navbar, Sidebar, Footer, UserMenu
│   │   ├── hooks/                      # Custom React Hooks
│   │   │   ├── useAudioRecorder.ts     # Web Audio API & MediaRecorder state
│   │   │   ├── useAudioWorklet.ts
│   │   │   ├── useWebSocketStream.ts   # Live Socket connection & stream protocol
│   │   │   ├── useSpeechReport.ts      # React Query query for report fetching
│   │   │   └── useAuth.ts
│   │   ├── lib/                        # Client Helper Modules
│   │   │   ├── api-client.ts           # Axios / Fetch client wrapper with interceptors
│   │   │   ├── audio-utils.ts          # Resampling, Decibel calculation, Waveform parser
│   │   │   ├── formatters.ts           # Time, WPM, and score formatting helpers
│   │   │   └── constants.ts
│   │   ├── stores/                     # Zustand Stores (Client state)
│   │   │   ├── useAudioStore.ts
│   │   │   ├── useSessionStore.ts
│   │   │   └── useUserStore.ts
│   │   ├── styles/                     # CSS Modules & Custom Design System Tokens
│   │   │   ├── globals.css
│   │   │   ├── design-tokens.css
│   │   │   └── studio.module.css
│   │   └── types/                      # Frontend TypeScript Types & Interfaces
│   │       ├── speech.ts
│   │       ├── user.ts
│   │       └── api.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
└── server/                             # Node.js + TypeScript Backend Application
    ├── src/
    │   ├── config/                     # Configuration Modules
    │   │   ├── database.ts             # Mongoose MongoDB Connection
    │   │   ├── redis.ts                # Redis Client Initialization
    │   │   ├── aws.ts                  # S3 Client Configuration
    │   │   ├── ai-providers.ts         # OpenAI, Anthropic, Deepgram API instances
    │   │   └── env.ts                  # Zod Validated Environment Schema
    │   ├── controllers/                # REST HTTP Controllers
    │   │   ├── auth.controller.ts
    │   │   ├── user.controller.ts
    │   │   ├── session.controller.ts
    │   │   ├── analytics.controller.ts
    │   │   ├── team.controller.ts
    │   │   └── billing.controller.ts
    │   ├── middlewares/                # Custom Express/Nest Middlewares
    │   │   ├── auth.middleware.ts      # JWT Validation & User Injection
    │   │   ├── rbac.middleware.ts      # Role-Based Permission Enforcer
    │   │   ├── rate-limiter.ts         # Redis Token Bucket Rate Limiter
    │   │   ├── error-handler.ts        # Centralized Error Middleware
    │   │   └── request-logger.ts       # Winston / Morgan HTTP Logger
    │   ├── models/                     # Mongoose Schema Definitions
    │   │   ├── User.model.ts
    │   │   ├── SpeechSession.model.ts
    │   │   ├── SpeechReport.model.ts
    │   │   ├── PracticeDrill.model.ts
    │   │   ├── Team.model.ts
    │   │   └── Subscription.model.ts
    │   ├── routes/                     # REST Route Handlers
    │   │   ├── auth.routes.ts
    │   │   ├── user.routes.ts
    │   │   ├── session.routes.ts
    │   │   ├── analytics.routes.ts
    │   │   ├── team.routes.ts
    │   │   ├── billing.routes.ts
    │   │   └── index.ts
    │   ├── services/                   # Domain Logic Services
    │   │   ├── auth.service.ts
    │   │   ├── session.service.ts
    │   │   ├── speech-analyzer.service.ts
    │   │   ├── acoustic-parser.service.ts
    │   │   ├── llm-coach.service.ts
    │   │   ├── s3.service.ts
    │   │   └── stripe.service.ts
    │   ├── websocket/                  # Live WebSocket Ingestion Gateway
    │   │   ├── connection.handler.ts
    │   │   ├── audio-stream.handler.ts
    │   │   └── stt-bridge.handler.ts
    │   ├── queues/                     # Async Job Queue Workers (BullMQ)
    │   │   ├── audio-processor.worker.ts
    │   │   ├── llm-report.worker.ts
    │   │   └── email-notification.worker.ts
    │   ├── utils/                      # Utilities & Helpers
    │   │   ├── logger.ts               # Winston Structured JSON Logger
    │   │   ├── crypto.ts               # Token hashing & encryption helpers
    │   │   ├── errors.ts               # Custom AppError hierarchy
    │   │   └── validators.ts           # Zod schema validators for requests
    │   ├── types/                      # Server TypeScript Types
    │   │   ├── index.ts
    │   │   └── express.d.ts
    │   └── app.ts                      # Server Entry point & Bootstrapper
    ├── package.json
    ├── tsconfig.json
    └── nodemon.json
```

---

## Database Architecture & MongoDB Schemas

### Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ SPEECH_SESSIONS : "conducts"
    USERS ||--o{ SUBSCRIPTIONS : "owns"
    USERS }|--|| TEAMS : "belongs to"
    SPEECH_SESSIONS ||--|| SPEECH_REPORTS : "generates"
    SPEECH_SESSIONS ||--o{ PRACTICE_DRILLS : "recommends"
    TEAMS ||--o{ SHARED_BENCHMARKS : "defines"

    USERS {
        ObjectId _id PK
        string email
        string passwordHash
        string fullName
        string role "ADMIN | COACH | USER"
        ObjectId teamId FK
        string avatarUrl
        boolean isMfaEnabled
        datetime createdAt
    }

    TEAMS {
        ObjectId _id PK
        string name
        ObjectId ownerId FK
        string planTier "PRO_TEAM | ENTERPRISE"
        datetime createdAt
    }

    SPEECH_SESSIONS {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string sessionType "PRACTICE | PRESENTATION | INTERVIEW"
        number durationSeconds
        string audioS3Url
        string status "PROCESSING | COMPLETED | FAILED"
        datetime createdAt
    }

    SPEECH_REPORTS {
        ObjectId _id PK
        ObjectId sessionId FK
        number overallScore
        object metrics Breakdown
        array transcriptSegments
        array fillerWordsDetected
        object acousticMetrics
        object llmFeedback
        datetime generatedAt
    }

    PRACTICE_DRILLS {
        ObjectId _id PK
        ObjectId sessionId FK
        string drillType "PAUSE_MASTER | VOCAL_VARIETY | PACE_CONTROL"
        string title
        string instructions
        boolean completed
    }

    SUBSCRIPTIONS {
        ObjectId _id PK
        ObjectId userId FK
        string stripeCustomerId
        string stripeSubscriptionId
        string status "ACTIVE | CANCELED | PAST_DUE"
        number monthlyMinuteAllowance
        number minutesUsedThisMonth
        datetime currentPeriodEnd
    }
```

### Detailed MongoDB Schemas & Indexes

#### 1. `users` Collection Schema
```typescript
{
  _id: Schema.Types.ObjectId,
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'ORG_ADMIN', 'MEMBER'], default: 'MEMBER' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true, default: null },
  avatarUrl: { type: String, default: '' },
  preferences: {
    targetWpm: { type: Number, default: 140 },
    fillerSensitivity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    theme: { type: String, default: 'dark' }
  },
  mfaSecret: { type: String, select: false },
  isMfaEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// Indexes: { email: 1 }, { teamId: 1 }
```

#### 2. `speech_sessions` Collection Schema
```typescript
{
  _id: Schema.Types.ObjectId,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  sessionType: { 
    type: String, 
    enum: ['KEYNOTE_PREP', 'ELEVATOR_PITCH', 'INTERVIEW_DRILL', 'FREE_PRACTICE'], 
    default: 'FREE_PRACTICE' 
  },
  durationSeconds: { type: Number, default: 0 },
  audioS3Key: { type: String, required: true },
  audioS3Url: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['STREAMING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'STREAMING', 
    index: true 
  },
  processingError: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: -1 }
}
// Compound Indexes: { userId: 1, createdAt: -1 }, { status: 1 }
```

#### 3. `speech_reports` Collection Schema
```typescript
{
  _id: Schema.Types.ObjectId,
  sessionId: { type: Schema.Types.ObjectId, ref: 'SpeechSession', required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  overallScore: { type: Number, min: 0, max: 100, required: true },
  scoreBreakdown: {
    pacingScore: Number,      // 0-100
    clarityScore: Number,     // 0-100
    pitchVarietyScore: Number,// 0-100
    fillerScore: Number,      // 0-100
    persuasivenessScore: Number // 0-100
  },
  acousticMetrics: {
    averageWpm: Number,
    wpmVariance: Number,
    pitchMinHz: Number,
    pitchMaxHz: Number,
    pitchMeanHz: Number,
    pitchStandardDeviation: Number,
    pauseCount: Number,
    totalPauseDurationSeconds: Number,
    averageVolumeDecibels: Number
  },
  fillerWords: [{
    word: String,           // "um", "uh", "like", "you know"
    timestampStart: Number, // Seconds from audio start
    timestampEnd: Number
  }],
  transcriptSegments: [{
    id: String,
    speaker: String,
    text: String,
    start: Number,
    end: Number,
    words: [{ word: String, start: Number, end: Number, confidence: Number }]
  }],
  llmAnalysis: {
    executiveSummary: String,
    strengths: [String],
    areasForImprovement: [String],
    rephrasedSuggestions: [{
      originalText: String,
      improvedText: String,
      reasoning: String
    }],
    actionableExercises: [{
      exerciseName: String,
      instructions: String
    }]
  },
  generatedAt: { type: Date, default: Date.now }
}
// Indexes: { sessionId: 1 }, { userId: 1, overallScore: -1 }
```

---

## REST API Design & Complete Route Inventory

### Base Path: `/api/v1`

| HTTP Method | Endpoint | Description | Auth Required | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Register new user account | No | Public |
| **POST** | `/auth/login` | Authenticate user & return Access + Refresh Tokens | No | Public |
| **POST** | `/auth/refresh-token` | Obtain new access token via HTTP-Only refresh cookie | No | Public |
| **POST** | `/auth/logout` | Revoke tokens & clear auth cookies | Yes | Any User |
| **GET** | `/users/me` | Get currently logged-in user profile | Yes | Any User |
| **PATCH** | `/users/me` | Update profile preferences & target WPM | Yes | Any User |
| **POST** | `/sessions/initiate` | Create new session metadata & get S3 upload signature | Yes | Any User |
| **GET** | `/sessions` | List user's historical practice sessions (Paginated) | Yes | Any User |
| **GET** | `/sessions/:id` | Get details of a single practice session | Yes | Owner / Admin |
| **DELETE** | `/sessions/:id` | Soft delete a session and archive audio | Yes | Owner / Admin |
| **GET** | `/sessions/:id/report` | Fetch full generated AI speech report | Yes | Owner / Admin |
| **GET** | `/analytics/overview` | Fetch user performance trends & metric progress | Yes | Any User |
| **GET** | `/analytics/leaderboard` | Get team or global anonymized benchmark metrics | Yes | Team Member |
| **POST** | `/billing/create-checkout-session` | Initialize Stripe Checkout session for Pro/Enterprise | Yes | Any User |
| **POST** | `/billing/webhook` | Handle Stripe async webhook events (Payment Succeeded, Cancelled) | No (Stripe Signature) | Stripe IP |

---

## Authentication, Authorization & Security Architecture

### Authentication Flow Architecture
```mermaid
sequenceDiagram
    participant Client as Next.js Client
    participant Auth as Auth Service Gateway
    participant Redis as Redis Session Cache
    participant DB as MongoDB User Collection

    Client->>Auth: POST /api/v1/auth/login { email, password }
    Auth->>DB: Query User by Email
    DB-->>Auth: User Record (Hashed Password)
    Auth->>Auth: Verify Argon2id Password Hash
    
    alt Invalid Credentials
        Auth-->>Client: 401 Unauthorized (Invalid Email or Password)
    else Valid Credentials
        Auth->>Auth: Generate JWT Access Token (15 min exp) + Refresh Token (7 day exp)
        Auth->>Redis: Store Hashed Refresh Token (Family ID tracking for reuse detection)
        Auth-->>Client: 200 OK + Set HTTP-Only, Secure, SameSite=Strict Refresh Cookie + JSON Access Token
    end
```

### Authorization Matrix (RBAC)

| Role | Access Scope | Session Limit | Team Management | Custom Prompting |
| :--- | :--- | :--- | :--- | :--- |
| **FREE_USER** | Personal Dashboard | 5 Sessions / Month | None | Default Coach |
| **PRO_USER** | Unlimited Personal | Unlimited | Read-Only Team | Advanced Coach |
| **TEAM_ADMIN** | Organization Vault | Unlimited | Add/Remove Members, View Metrics | Enterprise Prompting |
| **SUPER_ADMIN** | Platform Wide | Unlimited | Full Global Admin | Custom Models / Fine-tuning |

---

## Real-Time Audio & AI Streaming Pipeline

### WebSocket Framing Protocol Specs

```typescript
// Audio Stream Initialization Payload (Sent by Client upon socket connection)
interface SocketInitPayload {
  event: 'INIT_STREAM';
  data: {
    userId: string;
    sessionId: string;
    sampleRate: 16000 | 44100 | 48000;
    encoding: 'audio/webm' | 'audio/wav' | 'pcm16';
    targetWpm: number;
  };
}

// Live Feedback Event Payload (Pushed by WebSocket Server to Client HUD)
interface SocketLiveFeedbackEvent {
  event: 'LIVE_FEEDBACK';
  data: {
    timestampMs: number;
    currentWpm: number;
    wpmStatus: 'OPTIMAL' | 'TOO_FAST' | 'TOO_SLOW';
    lastWord: string;
    fillerDetected: boolean;
    fillerWord?: string;
    cumulativeFillerCount: number;
    transcriptSnippet: string;
  };
}
```

---

## State Management Strategy

```mermaid
graph LR
    subgraph Client State Tier
        UIState[UI Component Local State - React useState]
        AudioState[Audio & Recording State - Zustand Store]
        QueryCache[Async API Data - TanStack / React Query]
    end

    subgraph Synchronization & Server Data
        ServerDB[Backend REST & WS Services]
    end

    AudioState <--> UIState
    QueryCache <--> ServerDB
    AudioState <--> ServerDB
```

1. **Client Audio & Recording Store (Zustand)**: Controls active MediaStream, AudioContext state, gain meters, recording duration timers, live WPM calculations, and active Socket connection object.
2. **Server Data Cache (TanStack Query v5)**: Manages caching, background refetching, optimistic updates, and pagination for sessions list, user profiles, analytics dashboards, and report JSON responses.
3. **Session React Context / Local State**: Confined to transient UI states such as active tab selection in reports, open modal states, and teleprompter scroll positions.

---

## Resilience, Error Handling & Logging Strategy

### Centralized Error Handling Hierarchy
```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AudioProcessingError extends AppError {
  constructor(message = 'Audio Signal Analysis Failed', errorCode = 'AUDIO_PROC_ERROR') {
    super(message, 500, errorCode, true);
  }
}
```

### Logging & Observability Standard
- **Format**: Structured JSON via `Winston` or `Pino`.
- **Trace Context**: Enforce `X-Correlation-ID` header across HTTP and WebSocket pipelines to trace single request journeys through microservices.
- **Log Levels**:
  - `ERROR`: Unhandled exceptions, failed third-party APIs (S3 upload timeout, OpenAI rate limit).
  - `WARN`: Degradation events (Fallback to cached report, audio chunk dropped).
  - `INFO`: Business events (Session started, Speech Report generated, Stripe invoice paid).
  - `DEBUG`: Verbose WebSocket frames and audio frame timing.

---

## Multi-Level Caching & Performance Optimization

```mermaid
graph TD
    ClientReq[Client GET /api/v1/sessions/:id/report] --> L1{L1: Next.js / TanStack Client Cache?}
    L1 -- Hit --> ReturnClient[Return In-Memory Data]
    L1 -- Miss --> L2{L2: Redis Key: session:report:ID?}
    L2 -- Hit --> ReturnRedis[Return JSON from Redis]
    L2 -- Miss --> QueryMongo[Query MongoDB Database]
    QueryMongo --> SetRedis[Populate Redis Cache TTL 24h]
    SetRedis --> ReturnMongo[Return Fresh Data to Client]
```

---

## Environment Variables Specification (`.env.example`)

```bash
# Server Environment Config
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000

# Database & Redis Credentials
MONGODB_URI=mongodb://localhost:27017/speakwise_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Security & JWT Tokens
JWT_ACCESS_SECRET=super_secret_access_key_change_in_production_32chars
JWT_REFRESH_SECRET=super_secret_refresh_key_change_in_production_32chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY_32BYTES=0123456789abcdef0123456789abcdef

# Third-Party AI API Keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxx
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AWS Storage Config
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET_NAME=speakwise-audio-vault-prod

# Billing Integration (Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx
STRIPE_PRO_PLAN_PRICE_ID=price_xxxxxxxxxxxxxx
```

---

## Comprehensive Recommended Tech Stack & Library Matrix

| Tier / Module | Selected Technology / Library | Industry Justification & Alternatives Evaluated |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 14+ (App Router)` | Server components, optimized build output, built-in routing & SEO performance. |
| **UI Styling & System** | `TailwindCSS` + `Radix UI` | Accessible headless primitives paired with rapid utility-first design tokens. |
| **Client State** | `Zustand` + `TanStack Query` | Lightweight, scalable state management without Redux boilerplate overhead. |
| **Audio Processing (Web)**| `Web Audio API` + `AudioWorklet` | Low-latency audio sampling off the main thread; prevents UI stutter. |
| **Backend Runtime** | `Node.js` + `TypeScript` | High concurrency asynchronous I/O, shared TypeScript interfaces with frontend. |
| **WebSocket Framework** | `Socket.io` / `ws` | Resilient auto-reconnection, room clustering, and fallback transport capabilities. |
| **Database ORM** | `Mongoose` (MongoDB) | Dynamic document model suited for structured JSON AI reports and analytics. |
| **Queue Engine** | `BullMQ` + `Redis` | Industrial-strength asynchronous job processing with retry exponential backoff. |
| **Live ASR Service** | `Deepgram Nova-2` | Market leader in speech-to-text latency (<250ms) and word timestamp accuracy. |
| **Acoustic Processing** | `Python (Librosa / SoundFile)` | Industry standard signal analysis for pitch (F0 tracking) and decibel dynamics. |
| **LLM Coaching Engine** | `OpenAI GPT-4o` / `Claude 3.5` | Top-tier structured JSON formatting and high reasoning capabilities for coaching. |

---

## Project Timeline, Sprint Plan & Feature Roadmap

```mermaid
gantt
    title SpeakWise AI Sprint & Execution Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation & Architecture
    Architecture Spec & Folder Setup  :done, p1, 2026-08-01, 2026-08-05
    Database Schema & Auth Setup       :active, p2, 2026-08-06, 2026-08-12
    
    section Phase 2: Core MVP Engine
    Web Audio Stream & WS Gateway     :p3, 2026-08-13, 2026-08-20
    Live ASR & Filler Counter Cues     :p4, 2026-08-21, 2026-08-28
    Acoustic & LLM Analysis Pipeline   :p5, 2026-08-29, 2026-09-05
    
    section Phase 3: Dashboard & MVP Launch
    Interactive Report Dashboard       :p6, 2026-09-06, 2026-09-15
    Stripe Billing & Subscriptions     :p7, 2026-09-16, 2026-09-22
    MVP Beta Release                   :milestone, m1, 2026-09-25, 1d
    
    section Phase 4: V1 & V2 Extensions
    B2B Team Workspace & Benchmarks   :p8, 2026-09-26, 2026-10-10
    Multimodal Video Posture Engine    :p9, 2026-10-11, 2026-11-01
```

### Feature Prioritization Matrix (MVP vs V1 vs V2)

```
+--------------------------------------------------------------------------+
| MVP (Phase 1 & 2) - Core Value Proposition                                |
+--------------------------------------------------------------------------+
| - User Authentication (JWT + OAuth2 Google)                              |
| - Web Audio Microphone Streamer & Live WebSocket Gateway                 |
| - Real-time STT Transcript & Live WPM / Filler Word Alerts               |
| - Audio Upload to AWS S3 & Post-Speech Processing Queue                  |
| - Basic Acoustic Analysis (Pitch Range, Average Pace, Pauses)            |
| - LLM Report Generation (Score, Executive Summary, 3 Rephrased Sentence) |
| - Interactive Report Page with Audio-Transcript Sync                     |
| - Stripe Pro Subscription Tier Integration                                |

+--------------------------------------------------------------------------+
| V1 (Phase 3) - Polish & Team Collaboration                               |
+--------------------------------------------------------------------------+
| - Multi-Tenant B2B Workspaces & Team Benchmarks                          |
| - Guided Curriculum & Personalized Practice Drills (Pause Master)        |
| - Teleprompter Mode with Dynamic Auto-Scrolling                          |
| - Export PDF Reports & Public Shareable URL Links                        |
| - MFA (TOTP / Authenticator App Support)                                 |

+--------------------------------------------------------------------------+
| V2 (Phase 4) - Enterprise & Multimodal Expansion                         |
+--------------------------------------------------------------------------+
| - Webcam Posture, Eye Contact & Emotion Detection Pipeline               |
| - Real-time AI Rehearsal Partner (Conversational AI Rebuttal Agent)      |
| - Enterprise SSO (SAML 2.0 / Okta / Azure AD)                            |
| - Custom Fine-Tuned Domain Vocabulary Models (Medical, Legal, Technical) |
+--------------------------------------------------------------------------+
```

---

## Operational Strategies: Scalability, Cost & Performance

### 1. Low-Latency Performance Strategy
- **Web Audio Worklets**: Record and encode PCM audio in dedicated browser worker threads to avoid blocking the main UI thread during intense dashboard rendering.
- **WebSocket Streaming**: Stream audio in 100ms binary frames over direct TCP WebSockets instead of costly HTTP multipart uploads.
- **Edge Acceleration**: Terminate SSL and cache static assets at Cloudflare edge nodes globally, keeping TTFB (Time to First Byte) under 50ms.

### 2. Cost Optimization Strategy
- **Audio Compression**: Transcode raw WAV audio files into 32kbps AAC/Opus `.webm` before long-term S3 archival, reducing cloud storage bills by up to 80%.
- **LLM Prompt Caching & Model Tiering**: Use lightweight models (GPT-4o-mini) for initial transcript cleanup and disfluency counting, reserving GPT-4o / Claude 3.5 Sonnet for final executive coaching evaluation.
- **Ephemeral Job Workers**: Autoscale BullMQ worker instances based on Redis queue depth, scaling to 0 instances during off-peak night hours.

---

## Next Steps for Development Team

1. Initialize project root with the defined directory structure for `/client` and `/server`.
2. Configure `.env` using `.env.example` as a template.
3. Install frontend dependencies (`next`, `zustand`, `@tanstack/react-query`, `lucide-react`, `recharts`) and backend dependencies (`express`, `mongoose`, `redis`, `bullmq`, `socket.io`, `winston`, `zod`).
4. Provision MongoDB database cluster and Redis Sentinel instances.
