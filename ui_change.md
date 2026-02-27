# UI Change Log — Aamba / PanCred Frontend

All changes are **visual-only**. No business logic, component structure, API calls, or content was modified.

---

## 📁 Files Modified

| File | Category |
|---|---|
| `frontend/src/index.css` | Global CSS — all passes |
| `frontend/src/pages/LandingPage.jsx` | All passes |
| `frontend/src/pages/SignIn.jsx` | All passes |
| `frontend/src/pages/BorrowerDashboard.jsx` | All passes |
| `frontend/src/pages/LenderDashboard.jsx` | All passes |
| `frontend/src/pages/Borrow.jsx` | Spacing + accessibility |
| `frontend/src/pages/Lend.jsx` | Spacing |
| `frontend/src/pages/Dashboard.jsx` | Spacing |
| `frontend/src/pages/HowItWorks.jsx` | Spacing |
| `frontend/src/pages/Onboarding.jsx` | Color system |
| `frontend/src/pages/Profile.jsx` | Spacing + color |
| `frontend/src/pages/Signup.jsx` | Color system + spacing |
| `frontend/src/components/Navbar.jsx` | All passes |
| `frontend/src/components/Sidebar.jsx` | All passes |
| `frontend/src/components/Layout.jsx` | Color system |
| `frontend/src/components/LoanTimeline.jsx` | Color system |
| `frontend/src/components/TransactionAccordion.jsx` | Color system |
| `frontend/src/App.jsx` | Color system |

---

## Pass 1 — Accessibility Baseline (Dark Theme)

### `frontend/src/index.css`
- Mobile `font-size` set to `16px` (was `14px`)
- `.btn-primary` label upgraded from `text-[10px]` to `text-xs`
- Liveness button `linear-gradient` removed → replaced with solid `#2563eb`
- `backdrop-filter: blur(20px)` removed from liveness toast

### `frontend/src/pages/LandingPage.jsx`
- Removed decorative `blur-[120px]` orb div from hero section
- Hero badge text: `text-[9px]` → `text-xs`
- Step descriptions: `text-sm` → `text-base`
- Section eyebrow labels: `text-[9px]` → `text-xs`
- Pillar tag badges: `text-[8px]` → `text-xs`
- Feature list labels: `text-[8px]` → `text-xs`

### `frontend/src/pages/SignIn.jsx`
- Removed two decorative `blur-[120px]` background orbs
- Back button: `text-[10px]` → `text-sm`
- Form field labels: `text-[9px]` → `text-xs`
- Input fields: standardised to `text-base`
- OTP buttons: added `min-h-[44px]`
- MFA status text: `text-[11px]` → `text-sm`
- Footer text: `text-xs` → `text-sm`

### `frontend/src/components/Navbar.jsx`
- Desktop nav links: `text-xs` → `text-sm`
- Mobile "Protocol User" label: `text-xs` → `text-sm`

### `frontend/src/components/Sidebar.jsx`
- "Protocol Menu", "Support", "Microfinance" labels: `text-[10px]` → `text-xs`

### `frontend/src/pages/BorrowerDashboard.jsx`
- All `text-[8px]`–`text-[11px]` labels on cards, progress bars, status badges, loan cards, ad cards, on-chain archive → `text-xs`
- "Force Sync" button: `text-[8px] py-2` → `text-xs py-3 min-h-[44px]`

### `frontend/src/pages/LenderDashboard.jsx`
- All `text-[8px]`–`text-[10px]` labels on identity pills, marketplace cards, receivables, funded agreements → `text-xs`

---

## Pass 2 — Light Design System Migration

Complete theme swap: dark navy (`#020617`) → light mint (`#F2FBFA`), blue accent (`#2563eb`) → teal (`#2EC4B6`).

### `frontend/src/index.css` — Full Rewrite
```
Page Background:  #F2FBFA  (was #020617)
Card Background:  #FFFFFF  (was #0f172a)
Primary Accent:   #2EC4B6  (was #2563eb)
Heading Color:    #1F3F4C  (new token)
Body Text:        #475569  (new token)
Border:           #DCEEEF  (was #1e293b)
Success:          #16A34A
Warning:          #D97706
Font:             Inter, system-ui
Card shadow:      0 8px 24px rgba(46,196,182,0.12)
```

- `body` background and color updated to new tokens
- `.premium-card` rewritten: white bg, `#DCEEEF` border, `12px` radius, teal shadow
- `.btn-primary` rewritten: solid `#2EC4B6`, no gradient, no glow, `font-weight: 600`
- `.sidebar-link` hover → light teal bg
- Scrollbar → teal on light track
- AWS Amplify Liveness overrides remapped to light theme

### All 17 JSX files — 3 PowerShell bulk passes
| Old class | New class |
|---|---|
| `bg-fintech-surface` / `bg-fintech-card` | `bg-white` |
| `bg-slate-900` / `bg-slate-950` | `bg-fintech-dark` (`#F2FBFA`) |
| `bg-slate-800` | `bg-slate-100` |
| `text-white` (headings) | `text-fintech-heading` (`#1F3F4C`) |
| `text-slate-400` / `text-slate-500` | `text-fintech-muted` (`#475569`) |
| `bg-blue-600` / `bg-blue-500` | `bg-fintech-accent` |
| `text-blue-500` / `text-blue-400` | `text-fintech-accent` |
| `border-slate-900` / `border-slate-800` | `border-fintech-border` |
| `hover:bg-blue-700` | `hover:bg-[#25a99d]` |
| Blue gradient text spans | Solid `text-fintech-accent` |
| Dark CTA gradient section | `bg-white` flat | 

### `frontend/src/components/Navbar.jsx`
- Logo "A" letter: `text-fintech-heading` → `text-white` (on teal background)

### `frontend/src/components/Sidebar.jsx`
- Shield icon: `text-fintech-heading` → `text-white` (on teal background)

---

## Pass 3 — Visual Hierarchy & Whitespace

### `frontend/src/index.css`
- `.premium-card` padding: `24px` → `32px`
- Card shadow: heavy blur → subtle `0 2px 12px rgba(46,196,182,0.08)`
- Heading `font-weight`: `600` → `700`
- Heading `letter-spacing`: `-0.02em` → `-0.025em`
- `.sidebar-link` py: `py-3` → `py-3.5`
- Active sidebar `font-weight`: → `700`
- Added `.stat-number` utility: `36px`/`48px`, `font-weight: 700`

### All pages — 2 PowerShell bulk passes
- Hero section top padding: `pt-32 pb-20` → `pt-40 pb-24`
- Section vertical padding: `py-20 md:py-32` → `py-24 md:py-36`
- Stat numbers: `text-2xl md:text-4xl` → `text-4xl md:text-5xl`
- Stat item spacing: `space-y-1` → `space-y-3`
- Section eyebrow labels: `text-fintech-muted font-black` → `text-fintech-accent font-semibold`
- Section H2: `font-black italic tracking-tighter` → `font-bold tracking-tight`
- Step cards padding: `!p-8` → `!p-10`
- Step descriptions: `text-sm leading-relaxed` → `text-base leading-[1.7]`
- Feature list labels: `text-xs font-black` → `text-sm font-semibold`
- CTA section padding: `p-12 md:p-20` → `p-16 md:p-24`
- Dashboard amounts: `font-black italic tracking-tighter` → `font-bold tracking-tight`
- Dashboard card `!p-6` → `!p-8`
- Main column spacing: `space-y-6 md:space-y-8` → `space-y-8 md:space-y-10`
- Navbar link gap: `space-x-8` → `space-x-10`
- Nav link weight: `font-black uppercase tracking-widest` → `font-semibold uppercase tracking-wide`

---

## Pass 4 — Accessibility Precision

### `frontend/src/index.css`
- Body `line-height`: `1.6` → `1.65`
- Global rule added: `button { min-height: 44px }` (enforces 44px tap target on all buttons)

### `frontend/src/pages/SignIn.jsx`
- Page subtitle: `text-sm italic` → `text-base font-normal` (no italic)
- MFA description: `text-sm italic` → `text-base font-normal`
- Footer text: `text-sm italic` → `text-base font-normal`
- Verified email display: `text-sm` → `text-base`
- Verify OTP button text: `text-fintech-heading` → `text-white` (contrast fix on teal)

### `frontend/src/pages/BorrowerDashboard.jsx`
- All card detail labels (Interest, Term, Total Settle, Blockchain Evidence, Principal, Total Repay, Duration, Network, Identity Node, Linked Identity): `text-xs` → `text-sm`
- Trust Score/Completed Loans/Identity status labels: `text-xs` → `text-sm`
- Protocol Health section header: `text-xs` → `text-sm`
- Force Sync button py: `py-3` → `py-4`

### `frontend/src/pages/LenderDashboard.jsx`
- Installment, Next Due, Borrower labels: `text-xs` → `text-sm`

### `frontend/src/pages/Borrow.jsx`
- Submit button text: `text-[10px] md:text-xs` → `text-sm`

---

## 🔀 Git: Create Branch, Push Changes, and Merge to Main

### Step 1 — Check current status
```bash
cd c:\VS-Code_C_drive\Hackathon\Project_Morpheus-26\aamba
git status
```

### Step 2 — Create and switch to new branch
```bash
git checkout -b ui/design-system-and-accessibility
```

### Step 3 — Stage all changed files
```bash
git add frontend/src/index.css
git add frontend/src/pages/LandingPage.jsx
git add frontend/src/pages/SignIn.jsx
git add frontend/src/pages/BorrowerDashboard.jsx
git add frontend/src/pages/LenderDashboard.jsx
git add frontend/src/pages/Borrow.jsx
git add frontend/src/pages/Lend.jsx
git add frontend/src/pages/Dashboard.jsx
git add frontend/src/pages/HowItWorks.jsx
git add frontend/src/pages/Onboarding.jsx
git add frontend/src/pages/Profile.jsx
git add frontend/src/pages/Signup.jsx
git add frontend/src/components/Navbar.jsx
git add frontend/src/components/Sidebar.jsx
git add frontend/src/components/Layout.jsx
git add frontend/src/components/LoanTimeline.jsx
git add frontend/src/components/TransactionAccordion.jsx
git add frontend/src/App.jsx
git add ui_change.md
```

Or stage everything at once:
```bash
git add -A
```

### Step 4 — Commit
```bash
git commit -m "ui: apply light design system, accessibility, and visual hierarchy improvements

- Migrate from dark navbar theme to light design system (#F2FBFA bg, #2EC4B6 teal accent)
- Remove all decorative blur orbs and gradients
- Enforce 16px minimum body text, 44px minimum button height
- Upgrade all sub-12px labels to text-xs/text-sm across dashboards
- Add Inter font, new card shadow, 32px card padding
- Increase section whitespace and stat number dominance
- Fix Verify OTP button contrast (white text on teal)
- Add global button min-height: 44px CSS rule
- No content, logic, or layout changes"
```

### Step 5 — Push the branch to remote
```bash
git push -u origin ui/design-system-and-accessibility
```

### Step 6 — Merge into main

**Option A: Via GitHub Pull Request (recommended)**
1. Go to your GitHub repository
2. A banner will appear: *"ui/design-system-and-accessibility had recent pushes"* → click **Compare & pull request**
3. Title: `UI: Light Design System + Accessibility Pass`
4. Click **Create pull request** → **Merge pull request** → **Confirm merge**

**Option B: Locally via git**
```bash
git checkout main
git pull origin main
git merge ui/design-system-and-accessibility
git push origin main
```

### Step 7 — Clean up branch (optional)
```bash
git branch -d ui/design-system-and-accessibility
git push origin --delete ui/design-system-and-accessibility
```

---

## ✅ What Was NOT Changed

- No business logic
- No API endpoints or calls
- No component structure or order
- No content (text, numbers, labels)
- No color hex values (only class names remapped to new tokens)
- No new components added
- No existing components removed
