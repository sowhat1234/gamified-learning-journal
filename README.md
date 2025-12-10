# 📚 Gamified Learning Journal

A modern, gamified learning journal application built with Next.js, TypeScript, Tailwind CSS, and Shadcn UI. Track your learning progress, earn XP, unlock achievements, and build consistent learning habits.

## ✨ Features

- **📝 Guided Journal Entries** - Multi-step form with concept, challenge, focus rating, and improvement goals
- **🎮 Gamification System** - XP, levels, achievements, and quests
- **🔥 Streak Tracking** - Build consistent learning habits
- **📊 Analytics & Insights** - Heatmaps, focus trends, and personalized suggestions
- **🎨 Theme Unlocks** - Earn dark mode and custom themes through leveling
- **🛒 Reward Shop** - Spend XP on cosmetic rewards
- **📱 Responsive Design** - Works on desktop and mobile
- **💾 Local Storage** - All data persists in your browser

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20)
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/gamified-learning-journal.git
cd gamified-learning-journal

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests (vitest)
npm run test:run # Run tests once
```

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Testing**: [Vitest](https://vitest.dev/)

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── achievements/       # Achievements trophy case
│   ├── dashboard/          # Main dashboard
│   ├── journal/            # Journal entry & review
│   ├── settings/           # Data export/import
│   ├── shop/               # Reward shop
│   └── stats/              # Analytics & insights
├── components/             # React components
│   ├── layout/             # App shell, sidebar, nav
│   ├── providers/          # Context providers
│   └── ui/                 # Shadcn UI components
├── hooks/                  # Custom React hooks
│   ├── useGamification.ts  # XP, levels, achievements
│   ├── useJournal.ts       # Journal entries & templates
│   └── useInsights.ts      # Analytics & suggestions
├── utils/                  # Utility functions
├── lib/                    # Shared libraries
└── __tests__/              # Test files
```

---

## 🚢 Deployment

### Deploy to Render

#### Option 1: Blueprint (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard → Blueprints](https://dashboard.render.com/blueprints)
3. Click **"New Blueprint Instance"**
4. Connect your GitHub repository
5. Render will auto-detect `render.yaml` and deploy

#### Option 2: Manual Web Service

1. Go to [Render Dashboard → New Web Service](https://dashboard.render.com/new/web)
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `gamified-learning-journal` |
| **Runtime** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` (or higher) |

4. Add Environment Variables (see below)
5. Click **"Create Web Service"**

#### Option 3: Render CLI

```bash
# Install Render CLI
npm install -g @render-cli/render

# Login to Render
render login

# Deploy using blueprint
render blueprint launch
```

### Environment Variables for Render

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_VERSION` | `20` | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `NEXT_TELEMETRY_DISABLED` | `1` | Optional |

### Deploy Script

A deployment helper script is included:

```bash
# Make executable
chmod +x scripts/ci/deploy.sh

# Run deployment script
./scripts/ci/deploy.sh
```

This script will:
- Initialize git repository (if needed)
- Commit all files
- Guide you through GitHub repo creation
- Provide Render deployment instructions

---

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/gamified-learning-journal)

Or manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 🧪 Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test -- --coverage
```

## 📦 Data Management

All data is stored locally in your browser's localStorage. You can:

- **Export**: Settings → Export Data (downloads JSON backup)
- **Import**: Settings → Import Data (restore from backup)
- **Reset**: Settings → Reset All Data (clear everything)

## 🎯 Gamification Details

### Leveling System
- Level N requires N × 100 XP
- Level 1 = 100 XP, Level 2 = 200 XP, etc.

### Achievements
| Achievement | Requirement |
|-------------|-------------|
| 🔥 7-Day Streak Warrior | 7-day journaling streak |
| 🧮 Math Mastery | 10 math-tagged entries |
| 🎯 Deep Focus | 4 hours total focus time |
| 👑 Consistency King | 20 journal entries |

### Unlockables
| Feature | Unlock Level |
|---------|--------------|
| 🌙 Dark Mode | Level 3 |
| 🎨 Custom Themes | Level 5 |
| 📊 Advanced Stats | Level 7 |

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 🙏 Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful components
- [Lucide](https://lucide.dev/) for the icons
- [Framer Motion](https://www.framer.com/motion/) for animations
