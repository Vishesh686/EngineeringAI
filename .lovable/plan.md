# MECHAI — Build Plan

This is a huge scope (full SaaS platform). I'll build a strong **v1 foundation** that looks investor-demo ready, then we iterate on the deeper features in follow-up turns.

## What I'll ship in this first build

### 1. Design system (futuristic engineering aesthetic)
- Dark-mode-first, deep black + electric blue/cyan accents
- Glassmorphism cards, subtle grid/mesh background, smooth Framer Motion animations
- Semantic tokens in `src/styles.css` (oklch), typography pair tuned for technical SaaS

### 2. Landing page (`/`)
- Hero with animated mesh/CFD-contour background, dual CTAs
- Features grid (10 cards: AI Assistant, CFD/FEA, Screenshot-to-Solution, Research Copilot, Calculators, CAD, PDF, Memory, Workflow, Cloud Workspace)
- Animated chat demo preview
- Testimonials
- Pricing (Free / Pro / Enterprise)
- Final CTA + footer

### 3. Auth (Lovable Cloud)
- Email/password + Google sign-in
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `profiles` table + `user_roles` table (with `has_role` SECURITY DEFINER for admin)
- Protected `_authenticated` layout

### 4. App dashboard shell (`/app`)
- Collapsible sidebar (New Chat, Recent, Tools, Research, Files, Calculators, Simulation, Settings, Profile, Billing, Admin)
- Chat interface with streaming responses via Lovable AI Gateway (default `google/gemini-3-flash-preview`)
- Markdown + code block + LaTeX (KaTeX) rendering
- Engineering mode selector (General, Aerospace, CFD, FEA, Thermo, Manufacturing, Robotics, MATLAB, Research, Design Opt) — each with tailored system prompt
- Image + PDF upload in chat (multimodal)
- Chat history persisted in DB

### 5. Database (Lovable Cloud)
- `profiles`, `user_roles`, `chats`, `messages`, `uploaded_files`, `engineering_memory`
- RLS on everything, scoped to `auth.uid()`

### 6. Stubbed pages (real pages, minimal content) so nav works
- Calculators hub (with 2 working calcs: Reynolds, Mach — rest as "coming soon" cards)
- Research workspace (placeholder)
- Files page (lists uploads)
- Profile, Settings, Billing, Admin (admin gated by role)

## What's deferred to follow-up turns
- Full calculator suite (13 calcs) — ship 2, scaffold the rest
- Full research copilot workflow (lit review generator, citation tools)
- Full admin analytics dashboard
- Notifications system, achievements, badges
- Stripe billing wiring (UI only in v1)
- CAD/SolidWorks/ANSYS plugin scaffolding
- RAG / vector search
- Mobile app

## Tech notes
- Stack is fixed by template: **TanStack Start + React + Tailwind v4 + Lovable Cloud (Supabase under the hood)**. Not Next.js/Vercel — but architecture is equivalent and scalable.
- AI via **Lovable AI Gateway** (no API keys needed from you), with provider-agnostic structure so we can swap models later.
- Streaming via SSE through a server route.

Approve and I'll start building. Reply with changes if you want to reshape scope (e.g. "skip pricing, focus on chat" or "ship all 13 calculators").