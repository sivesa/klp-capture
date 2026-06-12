# Contributing to KLP Capture

Thank you for contributing to the Kaizen Learning Platform! This document outlines our development guidelines.

## Reporting Issues

1. Check existing issues first
2. Include: reproduction steps, expected vs actual behavior, environment (OS, browser, Node version)
3. Attach screenshots if relevant
4. Use issue templates if available

## Submitting Pull Requests

### Before You Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Keep commits atomic and well-described

### Code Standards

- **TypeScript**: Use strict mode, avoid `any` types
- **React**: Functional components + hooks, no class components
- **Naming**: camelCase functions, PascalCase components
- **Formatting**: Prettier (if configured)
- **Comments**: Explain intent, not obvious code

### Testing

- Test offline scenarios (DevTools → Offline)
- Test on mobile-sized viewport (DevTools → Device mode)
- Test all form inputs and validations
- Verify no console errors

### Commit Messages

```
feat: add AI grade panel to review page
fix: correct PDF footer alignment on mobile
docs: update API integration guide
style: refactor theme variables
chore: upgrade dependencies
```

### PR Checklist

- [ ] Feature branch created from `main`
- [ ] Commit messages are descriptive
- [ ] No console errors or warnings
- [ ] Tested offline scenario
- [ ] Tested on mobile viewport
- [ ] Updated README if docs needed
- [ ] No secrets/API keys committed

## Code Review

Maintainers will review within 2–3 days. Be prepared to:
- Respond to feedback respectfully
- Make requested changes
- Re-request review after updates

## Branching Strategy

- **main** — production-ready (protected)
- **develop** — staging/integration branch
- **feat/*** — feature branches
- **fix/*** — bug fix branches
- **docs/*** — documentation-only

## Release Process

1. Version bump in `package.json` (semantic versioning)
2. Update `CHANGELOG.md`
3. Tag release: `git tag v1.2.3`
4. Build for iOS/Android
5. Submit to App Store / Google Play

---

Questions? Reach out to the Kaizen Wizard Solutions dev team.
