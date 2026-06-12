# Changelog

All notable changes to KLP Capture will be documented in this file.

## [1.0.0-beta] — 2026-06-12

### Added
- Multi-photo capture pipeline with automatic rotation detection
- Client-side PDF generation using pdf-lib (A4 with branded footer)
- Offline-first submission with exponential back-off retry queue
- Gemini 2.5 Flash integration via BFF proxy for AI grade suggestions
- Assignment list with filterable status badges (pending, captured, submitted, graded, failed)
- Secure token storage (Keychain / EncryptedSharedPreferences)
- Home tab with stats dashboard (success rate, edit rate, weekly submissions)
- Settings page with image processing toggles and integration status
- Full offline support: capture, PDF generation, and local sync queue
- Responsive UI built with Ionic 7 and custom KLP design system

### Known Issues
- Camera capture is stubbed in web development mode (returns empty)
- Gemini analysis latency simulated with 2-second delay
- SQLite database currently uses in-memory fallback (production uses Capacitor SQLite)

### Todo (Phase 2+)
- Perspective crop and deskew editor (Cropper.js integration)
- Image blurriness detection and retake prompts
- Biometric authentication (fingerprint/face)
- Push notifications for submission confirmation and grading
- Deep linking and app shortcuts
- Progressive Web App (PWA) support

---

**Kaizen Wizard Solutions · K2025630724**
