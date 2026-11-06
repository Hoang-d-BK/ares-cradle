# Ares Cradle 🚀🔴
**An Interactive Mars Outpost Engineering Simulator for Young Learners (Ages 7–12)**

Built with **React 18**, **Three.js (React Three Fiber)**, **Framer Motion**, **Tailwind CSS**, and **Zustand**. Designed with Hallmark & Impeccable UI principles.

---

## 🎮 Play Locally
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
# or preview production build
npm run preview
```
Visit `http://localhost:5173` in your browser.

---

## 📁 Project Architecture
- `src/modules/outpost-3d`: Three.js / React Three Fiber 3D Mars diorama with clickable base modules.
- `src/modules/mission-control`: Hallmark-style tactile HUD, resource dials, and power allocation toggles.
- `src/modules/simulation-engine`: Deterministic math for solar, battery, thermal, and oxygen trade-offs.
- `src/modules/audio`: Web Audio API sound synthesizer and telemetry chimes.
- `src/services/api`: Decoupled Service Adapter (`IMissionService`) supporting both mock and Django REST.
- `backend/`: Django 5.x REST Framework app for stage configs, sessions, and telemetry analytics.

---

## 🚀 Deploy to Vercel
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework Preset: **Vite** (Build: `npm run build`, Output: `dist`).
5. Click **Deploy**.
