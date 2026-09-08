# One-shot Cursor prompt — copy everything below the line

Paste this entire block into Cursor Agent in your **target** Next.js project.
Replace `TARGET_PROJECT` with your project path (e.g. `C:\GitHub\ridehail`).

---

```
Import the full Premium UI kit from my other local project into THIS project.

SOURCE (read-only — do not modify):
C:\GitHub\touritinerary creation\premium-ui-export\

TARGET (this project):
TARGET_PROJECT

## Step 1 — Copy files (PowerShell)

Run:
.\copy-from-touritinerary.ps1 -Target "TARGET_PROJECT"

Or manually:
Copy-Item "C:\GitHub\touritinerary creation\premium-ui-export\src\*" -Destination "TARGET_PROJECT\src\" -Recurse -Force

Then copy demo pages:
- demos\design-sidebar-page.tsx  → src\app\design\sidebar\page.tsx
- demos\prompt-page.tsx          → src\app\design\prompt\page.tsx
- demos\chat-bubble-page.tsx     → src\app\design\chat-bubble\page.tsx
- demos\dot-pattern-page.tsx     → src\app\design\dot-pattern\page.tsx
- demos\user-dropdown-page.tsx   → src\app\design\user-dropdown\page.tsx
- demos\footer-page.tsx          → src\app\design\footer\page.tsx

## Step 2 — Install dependencies

npm i framer-motion motion lucide-react @iconify/react next-themes class-variance-authority clsx tailwind-merge tw-animate-css @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-slot @radix-ui/react-scroll-area @radix-ui/react-tabs @radix-ui/react-separator @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-label @base-ui/react dicons

Optional (tables): npm i @tanstack/react-table

## Step 3 — Tailwind v4 CSS

Ensure src/app/globals.css starts with:
@import "tailwindcss";
@import "tw-animate-css";

MERGE (do not blindly overwrite) the design tokens + app-shell + desk-chat sections from:
C:\GitHub\touritinerary creation\premium-ui-export\src\app\globals.css

Key classes needed: .app-shell, .desk-chat, .desk-chat-greeting, .desk-chat-dock, .desk-chat-box, .page-title, .page-lead, sidebar tokens.

## Step 4 — Layout

Merge ThemeProvider + font variables from:
premium-ui-export\src\app\layout.example.tsx
into this project's src/app/layout.tsx (keep existing metadata/routes).

## Step 5 — Verify

- @/* alias → ./src/* in tsconfig.json (standard Next.js)
- npm run build passes
- Preview routes work: /design/prompt /design/sidebar /design/chat-bubble /design/dot-pattern /design/user-dropdown /design/footer

## What's included (all exportable from @/components/ui)

Shell: AppShell, AppShellUserMenu, AppBreadcrumb, theme-provider, sidebar, user-dropdown

Premium UI: ai-chat-input, ai-chat-landing (first page), chat-bubble, message-loading, dot-pattern, animated-menu-bar, circular-command-menu, be-ui-create-menu, footer, breadcrumb, tabs-in-cell-for-navigation, reui-autocomplete, expandable-text, empty-state

shadcn: button, card, input, label, textarea, select, checkbox, separator, alert, tabs, skeleton, scroll-area, table, badge, dropdown-menu, avatar

Barrel import: import { AiChatLanding, PromptInput, ChatBubble } from "@/components/ui"

## Rules

- Merge globals.css and layout — don't wipe existing app styles
- If a shadcn primitive already exists here, diff and keep the newer/better version or merge carefully
- Do not copy Dhel-specific desk/proposal code — UI kit only
- Report any file conflicts and how you resolved them
```
