# KLP Capture Development Guide

## Setting Up Development Environment

### Step 1: Clone & Install

```bash
git clone <repo-url> klp-capture
cd klp-capture
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env.development
# Edit .env.development if needed (defaults use http://localhost:3001 for mock LMS)
```

### Step 3: Start Dev Server

```bash
npm start
```

The app will open at http://localhost:3000. Hot-reload is enabled.

### Step 4: Mock Login

Use the pre-filled credentials:
- **Email**: `tmokoena@mandisa.edu.za`
- **Password**: `password123`

The app uses MOCK_ASSIGNMENTS from `src/hooks/mockData.ts` by default.

## Development Workflow

### Working on a Feature

1. **Create feature branch**
   ```bash
   git checkout -b feat/assignment-detail-ai-panel
   ```

2. **Edit files** (e.g., `src/features/review/AIGradePanel.tsx`)

3. **Hot reload** — browser auto-updates

4. **Test offline**
   - Toggle DevTools Network → Offline
   - Capture and submit → goes to syncQueue
   - Toggle Online → auto-retries

5. **Commit & push**
   ```bash
   git add .
   git commit -m "feat: add AI grade suggestion panel"
   git push origin feat/assignment-detail-ai-panel
   ```

### Useful npm Scripts

```bash
npm start              # Dev server
npm run build          # Prod build to /build
npm run lint           # ESLint (if configured)
npm test               # Jest tests (if configured)
npm run eject          # CRA eject (only if necessary)
```

## Mocking & Testing

### Replace Mock Data

Edit `src/hooks/mockData.ts`:
```typescript
export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'test-001', title: 'Your Test Assignment', ... },
];
```

### Enable Real API Calls

1. Update `.env.development`:
   ```
   REACT_APP_LMS_URL=https://your-lms.example.com/api/v1
   REACT_APP_BFF_URL=https://your-bff.example.com/api/ai
   ```

2. Uncomment real API calls in `src/services/api/lmsClient.ts`:
   ```typescript
   // const data = role === 'teacher'
   //   ? (await lmsClient.getTeacherAssignments()).items
   //   : await lmsClient.getStudentAssignments(userId);
   ```

### Simulate Offline

DevTools → Network tab → set throttling to "Offline" or "Slow 3G"

Then:
1. Capture pages
2. Generate PDF
3. Try to submit → goes to syncQueue
4. Set back to "Online" → auto-retries

## Code Style

- **TypeScript**: Use strict mode; avoid `any`
- **React**: Functional components + hooks
- **CSS**: Use CSS variables from `src/theme/variables.css`
- **Naming**: `camelCase` for functions, `PascalCase` for components
- **Comments**: JSDoc for public functions, explain "why" not "what"

## Debugging

### Chrome DevTools

Open http://localhost:3000 → F12

- **React DevTools**: Inspect component state/props
- **Network**: Monitor API calls
- **Storage**: View localStorage (secure store persists here)
- **Console**: Run `window.syncQueue.getAll()` to inspect queue

### VSCode Debugging

Install "Debugger for Chrome" extension, create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "attach",
      "name": "Attach to Chrome",
      "urlFilter": "http://localhost:3000/*",
      "port": 9222
    }
  ]
}
```

Then `chrome://inspect` and attach.

## Adding Dependencies

### UI Components

Already included: Ionic 7

To add custom component library:
```bash
npm install --save @radix-ui/react-dialog
```

### PDF Processing

Already included: pdf-lib

To update:
```bash
npm install --save pdf-lib@latest
```

### Drag-and-Drop

Already included: Sortable.js

### Image Cropping

Already included: Cropper.js

### State Management

Currently using React hooks. To add Redux/Zustand:
```bash
npm install --save zustand
# or
npm install --save @reduxjs/toolkit react-redux
```

## Building for Mobile

### iOS

```bash
npm run build
npx cap add ios
npx cap sync ios
open ios/App/App.xcworkspace
```

Then in Xcode: Product → Build & Run.

### Android

```bash
npm run build
npx cap add android
npx cap sync android
open android
```

Then in Android Studio: Build → Make Project.

## Deployment

### Web (Vercel / Netlify)

```bash
npm run build
# Push to Git
# Vercel/Netlify auto-deploys
```

### App Store

1. Set version in `package.json`
2. Build production bundle
3. Push to App Store / Google Play via Xcode / Android Studio

Certificates and provisioning profiles required (handled by DevOps).

## Troubleshooting

### "Cannot find module '@capacitor/camera'"

```bash
npm install --save @capacitor/camera
npx cap sync
```

### "TypeError: Cannot read property 'base64' of undefined"

Check that camera image is being captured. In dev, the camera shim returns empty—add mock image data to `capturePhoto()` for testing.

### "CORS error on LMS requests"

- LMS must have CORS headers configured
- Verify `REACT_APP_LMS_URL` is correct
- Check that Authorization header is being sent (inspect Network tab)

### Hot reload not working

```bash
# Clear cache
rm -rf node_modules/.cache
npm start
```

### Large bundle size

Check with:
```bash
npm install --save-dev webpack-bundle-analyzer
```

pdf-lib is lazy-imported (dynamic `import()`) so it doesn't bloat initial bundle.

---

Happy coding! 🚀
