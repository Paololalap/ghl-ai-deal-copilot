# 🚀 GHL AI Revenue & Lead Sentiment Copilot (API v2)

An atypical, high-impact enterprise portfolio project demonstrating real-time **Deal Health Scoring**, **Lead Sentiment Analysis**, and **Automated Revenue Churn Prevention** integrated with **GoHighLevel (GHL) API v2**.

---

## 🌟 Why This Project Stands Out (Portfolio & Client Pitch Value)
Instead of standard CRUD, webhooks, or basic contact syncers, this project solves a **multimillion-dollar agency problem**: *Sales team deal leakage and ghosting risk*. 

### Key Innovations:
1. **GHL API v2 Deep Integration**: Pulls contacts, opportunities, and multi-touch conversation notes/transcripts via GHL API v2 endpoints (`/contacts`, `/opportunities`, `/notes`).
2. **AI Sentiment & Health Engine**: Evaluates pipeline deals on a 0–100 Health Index, detecting churn risk, buying signals, and price friction before a prospect ghosts.
3. **Bi-directional Automated Sync**: Automatically pushes generated AI Executive Summaries and high-intent tags back into GoHighLevel contact records as notes and tags for immediate sales action.
4. **Executive Radar Dashboard**: Built with React, TypeScript, and Tailwind CSS for real-time visualization of healthy vs. at-risk revenue.

---

## 🏗️ Architecture & Data Flow

```
[ GHL API v2 / Webhook ] ──> [ Express Server ] ──> [ AI Sentiment Engine ]
                                    │                           │
                                    ▼                           ▼
                         [ Dashboard UI (React) ] <── [ GHL Note/Tag Auto-Sync ]
```

---

## ⚡ Tech Stack
- **Backend**: Node.js, Express, TypeScript, Axios, Dotenv
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **API Target**: GoHighLevel API v2 (`services.leadconnectorhq.com`)

---

## 🛠️ Quick Start & Running Locally

### 1. Backend Server Setup
```bash
# In project root
npm install
npm run dev
```
The server will start on `http://localhost:4000`.

### 2. Dashboard UI Setup
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` to view the interactive dashboard.

---

## 📄 Environment Configuration (`.env`)

```env
PORT=4000
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_KEY=your_ghl_api_v2_private_integration_token
GHL_LOCATION_ID=your_location_id
OPENAI_API_KEY=your_openai_api_key
USE_MOCK_GHL=true # Set to false to test against live GHL API v2 account
USE_MOCK_AI=true  # Set to false to use live OpenAI GPT-4 models
```

---

## 📡 API Endpoints

- `POST /api/webhook/ghl`: Endpoint for GoHighLevel Opportunity/Contact automation workflows.
- `GET /api/pipeline`: Fetches current GHL opportunities enriched with live AI deal health scores and sentiment metrics.
- `POST /api/analyze/:opportunityId`: Forces an immediate re-analysis of a specific GHL deal.
