# ISS Capture — ISS - Kaizen Learning Platform LMS

A cross-platform mobile application (React + Ionic) enabling teachers at South African schools to photograph handwritten answer sheets, convert them to PDFs, grade, and submit directly to the LMS with AI-powered grading suggestions.

## Features

- **Multi-photo capture pipeline** — photograph 1–N pages per submission
- **Automatic image processing** — rotation detection, grayscale, contrast boost, JPEG compression
- **Client-side PDF generation** — runs entirely on-device using pdf-lib
- **Offline-first** — capture and submit offline; auto-sync when connectivity restored
- **Gemini 2.5 Flash integration** — AI analysis of handwritten content via BFF proxy
- **Status tracking** — assignment list with filterable status badges
- **Secure authentication** — JWT tokens stored in Keychain / EncryptedSharedPreferences
- **Responsive UI** — Ionic components with custom ISS design system

## Tech Stack

- **Frontend**: React 18 + Ionic 7 + Capacitor 5
- **State**: React hooks + localStorage
- **Storage**: Secure token storage + SQLite (via Capacitor)
- **PDF**: pdf-lib (lazy-loaded, ~200KB)
- **AI**: Gemini 2.5 Flash via BFF proxy (API key server-side only)
- **LMS API**: REST with transparent JWT refresh + exponential back-off retry queue
- **CSS**: Custom design system (navy, teal, amber, rose theme)

## Quick Start

### Prerequisites
- Node.js 16+ (`npm -v` → 8+)
- Xcode 14+ (for iOS builds) or Android Studio (for Android builds)

### Installation

```bash
git clone https://github.com/sivesa/iss-capture.git
cd iss-capture
npm install
```

### Development

```bash
# Start web dev server (http://localhost:3000)
npm start

# The app uses mock data by default; real API calls commented in lmsClient.ts
# To enable real API: set REACT_APP_LMS_URL in .env.development
```

### Project Structure

```
src/
├── app/                         # IonApp + routing
├── features/
│   ├── auth/                   # Login, Settings
│   ├── assignments/            # List, detail, home
│   ├── capture/                # Camera, page reorder, crop
│   ├── pdf/                    # PDF builder (pdf-lib)
│   ├── review/                 # Review + AI panel
│   └── submit/                 # Final submission
├── services/
│   ├── api/                    # lmsClient, aiClient
│   ├── storage/                # secureStore, db
│   ├── image/                  # Canvas processing
│   └── sync/                   # Offline queue
├── hooks/                      # useAuth, useAssignments, etc.
├── components/                 # StatusBadge, SyncBanner, etc.
├── types/                      # Zod schemas, TypeScript interfaces
└── theme/                      # CSS variables, global styles
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
REACT_APP_LMS_URL=https://lms.kaizenwizard.co.za/api/v1
REACT_APP_BFF_URL=https://bff.kaizenwizard.co.za/api/ai
```

### Build for iOS

```bash
npx cap add ios
npx cap open ios
# Then build via Xcode
```

### Build for Android

```bash
npx cap add android
npx cap open android
# Then build via Android Studio
```

## API Integration

### LMS Endpoints

All requests include `Authorization: Bearer <token>` header.

**Auth**
```
POST   /api/v1/auth/login        → { user, token }
POST   /api/v1/auth/logout       → 204
POST   /api/v1/auth/refresh      → AuthToken
```

**Assignments**
```
GET    /api/v1/assignments/teacher?page=1&pageSize=20  → PaginatedResponse<Assignment>
GET    /api/v1/assignments/student/:id                 → Assignment[]
GET    /api/v1/assignments/:id                         → Assignment
```

**Submissions**
```
POST   /api/v1/submissions                → SubmissionResult
GET    /api/v1/submissions/:id/status     → SubmissionResult
```

### BFF (Gemini Proxy)

The mobile app **never** calls Gemini directly. All AI requests go through a Backend-For-Frontend:

```
POST   /api/ai/analyze              # Single-page analysis
POST   /api/ai/analyze-submission   # Multi-page holistic analysis
```

Request:
```json
{
  "imageBase64": "...",
  "mimeType": "image/jpeg",
  "assignmentContext": {
    "title": "The Great Trek Essay",
    "subject": "History",
    "maxGrade": 50,
    "rubric": "..."
  }
}
```

Response:
```json
{
  "suggestedGrade": 38,
  "maxGrade": 50,
  "confidence": "high",
  "contentAccuracy": 84,
  "answerQuality": "...",
  "strengths": ["..."],
  "improvements": ["..."],
  "rawText": "...",
  "analyzedAt": "2026-06-11T10:30:00Z"
}
```

## Security

- **HTTPS-only**: All requests over TLS 1.3
- **Token storage**: Keychain (iOS) / EncryptedSharedPreferences (Android)
- **Image handling**: AES-256-GCM encryption in transit; deleted after PDF generation
- **No API keys in bundle**: Gemini key held server-side in BFF only
- **CORS**: BFF enforces per-teacher rate limits (60 requests/hour)

## Offline Submission Flow

1. **Capture offline** → all image processing runs on-device
2. **PDF generation offline** → pdf-lib (200KB) generates A4 PDF locally
3. **Submit fails (no connectivity)** → syncQueue.enqueue(payload) persists to localStorage
4. **Connectivity restored** → window 'online' event triggers automatic retry
5. **Exponential back-off** → 5s, 10s, 20s, 40s, 80s (max 5 attempts)
6. **After max attempts** → status = 'failed', requires manual retry via Settings

## Customization

### Design System

Edit `src/theme/variables.css` to adjust:
- Brand colours (navy, teal, amber, rose)
- Border radius (r-sm, r-md, r-lg, r-xl)
- Typography (font family, letter spacing)
- Shadows and glows

### Mock Data

Replace `MOCK_ASSIGNMENTS` and `MOCK_USER` in `src/hooks/mockData.ts` or enable real API calls in services.

## Development Roadmap

- **Phase 1** (Weeks 1–3): Capture → local PDF pipeline
- **Phase 2** (Weeks 4–6): LMS integration + offline queue
- **Phase 3** (Weeks 7–9): Gemini AI grading suggestions
- **Phase 4** (Weeks 10–12): Polish, scale, App Store / Play Store release

## Troubleshooting

**"Module not found: cropperjs"**
```bash
npm install --save cropperjs @types/cropperjs
```

**"HTTPS required for production"**
Ensure all API URLs use `https://`. The app enforces HTTPS in production builds.

**"Capacitor plugin not found"**
```bash
npm install @capacitor/camera @capacitor/preferences @capacitor/network
npx cap sync
```

## Support

For issues or questions, contact the Kaizen Wizard Solutions development team.

---

**Kaizen Wizard Solutions (Pty) Ltd · K2025630724**
**Tshwane, Gauteng, South Africa**
**June 2026**
