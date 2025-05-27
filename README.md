# WordMax

**WordMax** is a fast-paced, single-word puzzle game where players compete to create the highest-scoring word using a shared set of 10 letters each day. Scores are calculated in real time using Scrabble-style point values, and players can see how they rank on the live leaderboard.

---

## How It Works

1. Click **Start** to reveal today’s 10 letters.
2. You have 3 minutes to submit one valid English word.
3. Letters can be reused as many times as you want, but only from today’s set.
4. Points decrease over time, so submit early to maximize your score.
5. See how your word ranks on the daily leaderboard.

---

## Features

- Shared daily letter set (synced via Supabase)
- Real-time scoring with countdown
- Live score preview as you type
- Leaderboard with rank placement callout
- Minimal, mobile-optimized UI
- Hosted via Vercel, backend powered by Supabase

---

## Tech Stack

- Frontend: HTML, CSS (custom dark theme), Vanilla JS
- Backend: Supabase (PostgreSQL + API)
- Deploy: Vercel
- Dictionary API: dictionaryapi.dev

---

## Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/WordMax.git
cd WordMax
