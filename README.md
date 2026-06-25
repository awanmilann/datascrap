# DataHarvest

**DataHarvest** is a web application for collecting and managing public data from allowed websites. It provides a dashboard to create projects, manage URLs, run scrape jobs, view results, and export data as CSV.

> **Disclaimer**: This application is designed for ethical data collection only. Users are responsible for ensuring they have permission to scrape target websites. Respect robots.txt, terms of service, and applicable laws.

## Architecture

```
GitHub Repository
  ↓
Vercel (Next.js Frontend)
  ├── Dashboard UI
  ├── Authentication UI
  ├── API Routes
  └── Webhook Receiver
  ↓
Supabase
  ├── Authentication
  ├── PostgreSQL Database
  ├── Row Level Security
  └── Storage (CSV Exports)
  ↓
Scraper Worker (FastAPI + BeautifulSoup + Playwright)
  ├── URL Validation
  ├── Robots.txt Check
  ├── Data Extraction
  └── Queue Processing
  ↓
Public Websites (with permission)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Scraper API | Python FastAPI |
| HTML Parsing | BeautifulSoup |
| JS Rendering | Playwright |
| Deployment (FE) | Vercel |
| Deployment (Worker) | Railway / Render / GCP Cloud Run |

## Folder Structure

```
dataharvest/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── admin/          # Admin pages
│   │   │   ├── api/            # API routes
│   │   │   ├── dashboard/      # Dashboard
│   │   │   ├── exports/        # Export history
│   │   │   ├── forgot-password/
│   │   │   ├── jobs/           # Job monitoring
│   │   │   ├── login/          # Login page
│   │   │   ├── onboarding/     # First-time onboarding
│   │   │   ├── privacy/        # Privacy policy
│   │   │   ├── projects/       # Project CRUD
│   │   │   ├── register/       # Registration
│   │   │   ├── reset-password/ # Password reset
│   │   │   ├── settings/       # User settings
│   │   │   └── terms/          # Terms of use
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   └── layout/         # Layout components
│   │   ├── lib/
│   │   │   └── supabase/       # Supabase clients
│   │   ├── types/              # TypeScript types
│   │   └── public/             # Static assets
│   └── scraper/                # FastAPI scraper worker
│       ├── app/
│       │   ├── api/            # API endpoints
│       │   └── main.py         # FastAPI entry
│       ├── services/           # Business logic
│       ├── workers/            # Background workers
│       ├── utils/              # Utilities
│       ├── models/             # Pydantic schemas
│       └── tests/              # Test files
├── packages/
│   └── shared/                 # Shared types
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── seed.sql                # Demo data
├── docker/
│   ├── Dockerfile.frontend
│   └── Dockerfile.scraper
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Supabase account
- (Optional) Docker

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/dataharvest.git
cd dataharvest
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API
3. Run migrations in SQL Editor or via CLI:
   ```bash
   # Copy migration content from supabase/migrations/001_initial_schema.sql
   # and execute in Supabase SQL Editor
   ```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SCRAPER_API_URL=http://localhost:8000
SCRAPER_INTERNAL_API_KEY=your_scraper_api_key
WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
# Frontend
cd apps/web
npm install

# Scraper
cd ../scraper
pip install -r requirements.txt
```

### 5. Run Database Migrations

Execute the SQL in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

### 6. Run Seed Data (Optional)

Execute `supabase/seed.sql` in SQL Editor to populate demo data.

### 7. Start Development

```bash
# Terminal 1: Next.js frontend
cd apps/web
npm run dev

# Terminal 2: FastAPI scraper
cd apps/scraper
uvicorn app.main:app --reload --port 8000
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### 8. Docker Compose

```bash
docker-compose up -d
```

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import repo in Vercel
3. Set root directory to `apps/web`
4. Configure environment variables
5. Deploy

### Scraper Worker (Railway / Render / GCP Cloud Run)

1. Set build command: `pip install -r requirements.txt`
2. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
3. Configure environment variables
4. Deploy

### Webhook Configuration

1. After deploying frontend, note the URL: `https://your-app.vercel.app`
2. Set `NEXT_PUBLIC_APP_URL` to this URL
3. The scraper worker calls `NEXT_PUBLIC_APP_URL/api/webhook` with status updates
4. Configure `WEBHOOK_SECRET` to match between frontend and scraper

## Security & Compliance

- **Only public data**: Application refuses non-http URLs, private IPs, localhost
- **Robots.txt check**: Every scrape job verifies robots.txt before proceeding
- **Domain blocklist**: Admins can block domains from being scraped
- **Rate limiting**: 3-second minimum delay between requests to same domain
- **Row Level Security**: Supabase RLS ensures data isolation between users
- **Input sanitization**: URLs are validated, HTML output is sanitized
- **Environment secrets**: All keys stored as environment variables, never in code
- **User consent**: Users must agree to terms before creating projects
- **Audit logging**: All significant actions are logged

## API Endpoints

### Frontend API (Next.js)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/[id]` | Get project details |
| PATCH | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Archive project |
| POST | `/api/scrape-jobs` | Create scrape job |
| GET | `/api/scrape-jobs` | List jobs |
| POST | `/api/export` | Export data to CSV |
| GET | `/api/blocklist` | List blocked domains (admin) |
| POST | `/api/blocklist` | Add blocked domain (admin) |
| POST | `/api/webhook` | Receive job status updates |

### Scraper Internal API (FastAPI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/scrape` | Execute scrape job |
| GET | `/api/jobs/[job_id]` | Get job status |
| POST | `/api/jobs/[job_id]/cancel` | Cancel job |
| POST | `/api/webhook` | Send status update |

## Database Tables

- `profiles` - User profiles with roles
- `user_consents` - User consent records
- `projects` - Scraping projects
- `project_urls` - URLs per project
- `scrape_jobs` - Scrape job records
- `scraped_items` - Collected data items
- `export_logs` - CSV export history
- `audit_logs` - Activity audit trail
- `domain_blocklist` - Blocked domains
- `error_logs` - Error records

## Production Checklist

- [ ] Supabase project created and migrated
- [ ] All environment variables configured
- [ ] Supabase RLS policies verified
- [ ] Storage bucket `exports` created
- [ ] Webhook secret generated and configured
- [ ] Scraper API key generated and configured
- [ ] Custom domain configured (optional)
- [ ] Rate limiting configured per environment
- [ ] Monitoring and alerts set up
- [ ] Terms of Use and Privacy Policy reviewed
- [ ] User consent flow tested
- [ ] Robots.txt checks working
- [ ] Domain blocklist management tested

## License

MIT
