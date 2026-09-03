# agent.md

Instructions for AI coding agents working in the `protal_dcampaign` repository. Keep this guide aligned with the established DCampaign website conventions as the portal grows.

## Commands

```bash
npm run dev       # local development server
npm run build     # production build
npm run start     # serve the production build
npm run lint      # ESLint checks
npm run typecheck # TypeScript validation
```

Run `npm run lint && npm run typecheck && npm run build` before considering a change complete. Use Node.js 22.13 or newer and keep npm as the only package manager for this repository.

## Project direction

- Use TypeScript, React, Next.js, and Tailwind CSS.
- Preserve the DCampaign design language: charcoal surfaces, orange `#f16133` accents, Manrope body copy, Outfit display type, compact uppercase labels, and restrained motion.
- This repository is the client portal, not a duplicate of the main marketing website. Reuse its visual system and engineering standards while keeping portal flows focused and task-oriented.
- Keep the first viewport useful. Portal actions, campaign status, approvals, and performance belong ahead of promotional content.

## Hard rules

### 1. Centralize brand and contact data

Do not scatter phone numbers, email addresses, domains, logos, or social links through components. Add a typed source under `lib/` or `data/` and import it at call sites.

### 2. Reuse interface primitives

Use the components in `components/ui` for buttons, forms, overlays, navigation, and feedback. Compose product-specific interfaces from those primitives instead of rebuilding accessibility behavior.

### 3. Keep first paint light

Lazy-load large charts, editors, modals, and other non-visible client widgets. Do not turn a static section into a client component unless interaction requires it.

### 4. Respect user motion preferences

Add every new CSS animation to the `prefers-reduced-motion` override. JavaScript-driven animation must also check the media query explicitly.

### 5. Avoid unsafe assertions

Prefer typed fallbacks, validation, or early returns over non-null assertions. Validate any external or user-provided value before rendering or persisting it.

### 6. Protect portal data

Never commit credentials, tokens, customer data, or production exports. Keep secrets in environment variables, update `.env.example` when adding a key, and make authorization decisions on the server.

### 7. Keep changes focused

Use semantic HTML, responsive layouts, accessible labels, keyboard-friendly interactions, and concrete copy. Add dependencies only when the existing stack cannot solve the requirement cleanly.

## Structure

- `app/` — routes, layouts, metadata, and shared styles.
- `components/ui/` — reusable accessible interface primitives.
- `components/` — portal-specific components.
- `lib/` — shared utilities and server-safe helpers.
- `public/` — static brand and social-preview assets.
