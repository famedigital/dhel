# Premium UI Export

Portable UI kit from the Dhel project: animated sidebar, profile dropdown with status badges, design tokens, form/profile pages, and premium chat/menu components.

## Quick start

1. **Copy** everything under `premium-ui-export/src/` into your Next.js project's `src/` folder (merge with existing files).

2. **Install dependencies:**

```bash
npm i framer-motion motion lucide-react @iconify/react next-themes \
  class-variance-authority clsx tailwind-merge tw-animate-css \
  @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-slot \
  @radix-ui/react-scroll-area @radix-ui/react-tabs @radix-ui/react-separator \
  @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-label \
  @base-ui/react dicons
```

Optional (only if you use data tables):

```bash
npm i @tanstack/react-table
```

3. **Tailwind v4** — ensure `postcss.config` uses `@tailwindcss/postcss` and your app CSS imports:

```css
@import "tailwindcss";
@import "tw-animate-css";
```

4. **Layout** — merge `src/app/layout.example.tsx` into your root layout (fonts + `ThemeProvider`).

5. **Path alias** — `@/*` → `./src/*` in `tsconfig.json` (standard Next.js).

---

## What's included

### App shell (sidebar + profile menu)

| File | Description |
|------|-------------|
| `components/AppShell.tsx` | Collapsible sidebar layout with nav + user menu |
| `components/AppShellUserMenu.tsx` | Wires `UserDropdown` (avatar, badges, theme toggle) |
| `components/AppBreadcrumb.tsx` | Path-based breadcrumb with badge pills |
| `components/ui/sidebar.tsx` | Core animated sidebar |
| `components/ui/user-dropdown.tsx` | Profile icon + status badge + premium menu |
| `components/ui/avatar.tsx` | Avatar primitive |
| `components/ui/badge.tsx` | Status / promo badges |
| `components/ui/dropdown-menu.tsx` | Radix dropdown |

### CSS / theme

| File | Description |
|------|-------------|
| `app/globals.css` | Full design system: tokens, sidebar, app shell, forms, desk chat, auth |
| `components/theme-provider.tsx` | Dark/light mode |
| `lib/utils.ts` | `cn()` helper |

### Profile / settings page template

| File | Description |
|------|-------------|
| `app/profile-page.example.tsx` | Copy to `app/settings/page.tsx` — uses `.panel`, `.form-stack`, `.input` |

### Premium UI components (`components/ui/`)

| Component | Files | Notes |
|-----------|-------|-------|
| **Barrel export** | `index.ts` | `import { PromptInput, AiChatLanding, ChatBubble } from "@/components/ui"` |
| **AI chat landing (first page)** | `ai-chat-landing.tsx` | Greeting + docked minimal `PromptInput` — desk or hero variant |
| Sidebar demo | `sidebar-demo.tsx` | Standalone sidebar preview |
| User dropdown demo | `user-dropdown-demo.tsx` | Profile menu only |
| AI chat input | `ai-chat-input.tsx` | Morphing Gemini-style prompt (`fullWidth`, `minimal` props) |
| Chat bubbles | `chat-bubble.tsx`, `message-loading.tsx`, `chat-bubble-demo.tsx` | Used in proposal desk thread |
| Footer + theme toggle | `footer.tsx`, `footer-demo-export.tsx` | Generic footer demo (no Dhel branding) |
| Dot pattern | `dot-pattern.tsx`, `dot-pattern-demo.tsx` | Background pattern |
| Animated menu bar | `animated-menu-bar.tsx`, `animated-menu-bar-demo.tsx` | |
| Circular command menu | `circular-command-menu.tsx`, `circular-command-menu-demo.tsx` | |
| BE create menu | `be-ui-create-menu.tsx`, `be-ui-create-menu-demo.tsx` | |
| Breadcrumb | `breadcrumb.tsx`, `breadcrumb-demo.tsx` | |
| Tabs in cell | `tabs-in-cell-for-navigation.tsx` | Segmented nav |
| REUI autocomplete | `reui-autocomplete.tsx` | Needs `@base-ui/react` |
| Expandable text | `expandable-text.tsx` | Read more / less |
| Empty state | `empty-state.tsx` | |
| shadcn primitives | `button`, `card`, `input`, `label`, `textarea`, `select`, `checkbox`, `separator`, `alert`, `tabs`, `skeleton`, `scroll-area`, `table` | |

---

## Demo pages (copy to your app)

Copy files from `demos/` into `src/app/` to preview:

| Route | Source |
|-------|--------|
| `/design/sidebar` | `demos/design-sidebar-page.tsx` |
| `/design/user-dropdown` | `demos/user-dropdown-page.tsx` |
| `/design/chat-bubble` | `demos/chat-bubble-page.tsx` |
| `/design/prompt` | `demos/prompt-page.tsx` |
| `/design/dot-pattern` | `demos/dot-pattern-page.tsx` |
| `/design/footer` | `demos/footer-page.tsx` |

---

## Usage examples

### App shell

```tsx
import { AppShell } from "@/components/AppShell";

export default function Page() {
  return (
    <AppShell brandName="Acme" displayName="Jane" email="jane@acme.com">
      <h1 className="page-title">Dashboard</h1>
    </AppShell>
  );
}
```

### User dropdown only

```tsx
import { UserDropdown } from "@/components/ui/user-dropdown";

<UserDropdown
  user={{ name: "Jane", username: "@jane", initials: "JA", status: "online" }}
  onAction={(action) => console.log(action)}
/>
```

### AI chat first page (landing)

```tsx
import { AiChatLanding } from "@/components/ui/ai-chat-landing";

// Full-screen hero (dot pattern + greeting + docked input)
<AiChatLanding
  variant="hero"
  greeting="What would you like to build?"
  placeholder="Ask anything…"
  onSubmit={(message) => console.log(message)}
/>

// Inside AppShell chat layout (same pattern as /desk)
<AppShell chatLayout contentWidth="full">
  <AiChatLanding
    eyebrow="Proposal desk"
    greeting="What does the client want?"
    description="Paste WhatsApp or email — we extract details locally."
    placeholder="Paste client WhatsApp or email…"
    onSubmit={handleSubmit}
  />
</AppShell>
```

Preview at `/design/prompt`.

### Desk chat layout

Use `chatLayout` + `.desk-chat` classes from `globals.css`:

```tsx
<AppShell chatLayout contentWidth="full">…</AppShell>
```

---

## Customization

- **Nav items** — pass `nav` prop to `AppShell` or edit `DEFAULT_NAV` in `AppShell.tsx`
- **Brand logo** — replace the placeholder div in `BrandMark` with your logo component
- **User actions** — pass `onUserAction` to `AppShell` to handle logout, settings, etc.
- **Trim CSS** — `globals.css` includes Dhel-specific ops/editor styles; delete sections you don't need (search for `ops-`, `docs-`, `portal-`, `media-`)

---

## One-command copy (Windows)

From the export folder:

```powershell
.\copy-to-project.ps1 -Target "C:\path\to\your-nextjs-app"
```

Then install deps from `package-deps.json` and merge `layout.example.tsx`.

---

## Source project

Exported from [Dhel](https://github.com/famedigital/dhel) — commit `cafdc0a` (Aug 2026).
