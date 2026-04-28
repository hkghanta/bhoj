# Bhoj — Developer Setup

## Prerequisites
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

## Local development

### 1. Clone and install

```bash
git clone https://github.com/hkghanta/bhoj.git
cd bhoj
pnpm install
```

### 2. Start services (PostgreSQL on port 5434 + Redis on 6379)

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Generate AUTH_SECRET:
openssl rand -base64 32
# Paste the output as AUTH_SECRET in .env.local
```

Also create a `.env` file for Prisma CLI:
```bash
echo 'DATABASE_URL="postgresql://bhoj:bhoj_dev@localhost:5434/bhoj_dev"' > .env
```

### 4. Run database migrations

```bash
pnpm exec prisma migrate dev
```

### 5. Start the dev server

```bash
pnpm dev
```

Open http://localhost:3000

---

## API keys needed for full features

| Key | Where to get | Feature |
|-----|-------------|---------|
| `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` | [console.cloud.google.com](https://console.cloud.google.com) | Google sign-in |
| `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys) | Subscriptions + Event Pass |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks | Payment webhooks |
| `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | [cloudinary.com/console](https://cloudinary.com/console) | Photo uploads |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) | Transactional email |
| `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` | [console.twilio.com](https://console.twilio.com) | WhatsApp notifications |

---

## Railway deployment

1. Create a new Railway project at [railway.app](https://railway.app)
2. Add **PostgreSQL** plugin and **Redis** plugin
3. Connect this GitHub repo — Railway auto-deploys on push to `main`
4. Set all environment variables from `.env.example` in the Railway dashboard
5. Railway will run `pnpm exec prisma migrate deploy && pnpm start` on each deploy

---

## Project structure

```
src/
├── app/
│   ├── (auth)/          # Login + register pages
│   ├── (customer)/      # Customer-only routes (protected)
│   ├── (vendor)/        # Vendor-only routes (protected)
│   └── api/             # API route handlers
├── lib/
│   ├── prisma.ts        # Prisma client singleton
│   ├── redis.ts         # Redis client singleton
│   └── auth.ts          # Auth.js v5 config
└── middleware.ts         # Route protection

prisma/
└── schema.prisma        # Full 26-entity database schema

docs/
├── superpowers/
│   ├── specs/           # Design specifications
│   └── plans/           # Implementation plans
└── screenshots/         # Design visuals
```
