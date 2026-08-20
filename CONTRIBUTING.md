# Contributing to SpeakWise AI

Thank you for your interest in contributing to **SpeakWise AI**! Follow these guidelines to ensure smooth code reviews and maintain our high architectural standards.

---

## 🛠️ Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/speakwise-AI.git
   cd speakwise-AI
   ```
2. Setup client & server dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. Start development servers:
   - Frontend: `cd client && npm run dev`
   - Backend: `cd server && npm run dev`

---

## 🎨 Code Style & Quality Standards

- **TypeScript**: Enforce strict mode with zero implicit `any` types.
- **Components**: Follow atomic design patterns in `client/src/components/`.
- **Backend Clean Architecture**: Strict separation of concerns (Controllers ➔ Services ➔ Models).
- **Commits**: Follow Conventional Commits format (e.g. `feat: add live WPM gauge`, `fix: handle socket timeout`).
