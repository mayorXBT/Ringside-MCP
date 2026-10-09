# Ringside — DESIGN.md

> Build spec for a coding agent. It covers **(A)** a marketing landing page and **(B)** the owner dashboard app (`apps/dashboard` in `mayorXBT/Ringside-MCP`, deployed at https://ringside-dashboard.vercel.app/).
> Status: v1, Oct 9 2026. Hackathon deadline: Colosseum World's Fair, **Oct 12 PT**. Badge everywhere: **DEVNET BETA**.
> Values marked **[measured]** were pulled from the reference product's live CSS on Oct 9 2026. Values marked **[inferred]** are judgment calls or observations, not extracted tokens.

---

## 0. TL;DR for the implementing agent

1. **Feel:** private-bank calm, like Mercury. Neutral near-black surfaces with a cool tint, **one** periwinkle accent, a cyan "private" color used only to mark shielded data, and big tabular numerals. Remove every green-on-green surface.
2. **Hierarchy:** the **Private balance card** is the hero of the app. Pairing becomes an **onboarding stepper** on first run, then lives in a **Connection drawer**. It never sits above the balance again.
3. **Honesty:** default Rings transfers hide **amount and asset**. **Sender, recipient, and signature stay public. Deposits and withdrawals are fully public.** Never imply more. Swap and escrow tools exist but return `ENGINE_UNAVAILABLE`, so label them **Preview**. Devnet private transfer is blocked upstream (Helius prover/indexer), and the full loop is verified on **localnet**. Copy must not say "live on devnet" for transfers.
4. **Stack:** Next 16 + React 19 (already in the repo). Add **Tailwind CSS v4 + shadcn/ui (Radix)**, `geist` fonts, `lucide-react`, and `motion` (Framer Motion). Keep `@solana/wallet-adapter-*`. Read `apps/dashboard/AGENTS.md` first: this Next version has breaking changes, so check `node_modules/next/dist/docs/`.
5. **Ship order:** tokens → app shell + balance hero + kill switch → onboarding/pairing → activity → policy form → deposit/withdraw sheets → auditor → landing page → polish/motion → a11y pass.

---

## 1. Research findings (sources for the decisions below)

### 1.1 Mercury (mercury.com): primary reference

Pages read: `/`, `/security`, `/treasury`, plus the four production CSS bundles from `/_next/static/chunks/*.css` (~337 KB).

**Typography [measured]**
- Families: `arcadiaDisplay` (display), `arcadia` (UI/body), `tiemposHeadline` / `tiempos` / `tiempos-fine` (serif accent, with light, regular, and medium italics preloaded), `IBM Plex Mono` (mono). Arcadia and Tiempos are commercial, so we substitute (§4.2).
- Variable weights: body **360**, regular **400**, strong **480**, `--font-weight-medium: 530`. Display uses **480**, which is lighter than most "bold" marketing type. That is a large part of Mercury's calm.
- Display sizes are fluid clamps: `display-1: clamp(2.625rem, .979rem + 4.116vw, 6rem)`, `display-2: clamp(2.25rem, .79rem + 3.66vw, 5.25rem)`, `display-3: clamp(2rem, .75rem + 3.126vw, 4.563rem)`, `display-4: clamp(1.75rem, .683rem + 2.668vw, 3.938rem)`, line-height **110%**.
- Text scale: xxs .625 / xs .75 / sm .875 / base 1 / md 1.125 / lg 1.313 / xl 1.5 / 2xl 1.75 / 3xl 2 / 4xl 2.25 / 5xl 2.625 / 6xl 3 / 7xl 3.438 rem. Body line-height 135–140%. Tracking uses tiny steps (0, .5%, 1%, 1.5%, 2%, 3%), positive at small sizes.
- `font-feature-settings: "tnum"` is used for numbers, and `"ss01"` appears.

**Color [measured]**
- Every hue has two ramps: a **base** ramp (desaturated, for surfaces and text) and a **magic** ramp (saturated, for accents), plus alpha steps.
- Neutral base (cool, slightly blue-violet): 50 `#fbfcfd`, 100 `#f4f5f9`, 150 `#ededf3`, 200 `#dddde5`, 300 `#c3c3cc`, 400 `#9d9da8`, 500 `#70707d`, 600 `#535461`, 700 `#363644`, 800 `#272735`, 900 `#1e1e2a`, 950 `#171721`, 1000 `#10101a`.
- Primary = **purple-magic-600 `#5266eb`** (hover 700 `#4354c8`, active 800 `#3442a6`). On dark, text-primary = purple-magic-400 **`#9cb4e8`**.
- `.dark-neutral-theme`: background-default = neutral-950 `#171721`, background-secondary and surface-default = neutral-900 `#1e1e2a`, surface hover = 800 `#272735`, active = 700 `#363644`, surface-emphasized = purple-magic-400 at ~20% alpha, frosted surfaces = `#afb2ce` at 8–36% alpha, border-frosted = `#afb2ce5c`.
- Semantic: green-magic-600 `#188554` / 400 `#77c599`, red-magic-600 `#d03275` / 400 `#fc92b4`, orange-magic-600 `#c45000` / 400 `#fc9b6f`, blue-magic-400 `#77becf`. On dark, error text = red-magic-400.
- Text roles: `text-default`, `text-emphasized`, `text-subdued`, `text-disabled`, `text-primary`, `text-error`. Four roles, not twelve.
- Themes are per section: neutral, beige, blue, green, orange, and purple, each with a dark variant. The homepage switches section themes as you scroll **[inferred from theme classes]**.

**Spacing / radius / motion [measured]**
- Pixel spacing tokens: 1, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 96, 112, 128, 144, 160, 192. Semantic gaps step up by breakpoint: `gap-md` 16→32, `gap-lg` 24→32, `gap-xl` 32→40, `gap-2xl` 56→80, `gap-3xl` 80→128. Navbar height 72px.
- Radii: sm 4, md 6, lg 8, xl 12, 2xl 16, 3xl 24, 4xl 32, 5xl 40.
- Shadows are almost absent. Depth comes from surface steps and frosted alpha borders **[inferred: nearly every `box-shadow` is the Tailwind ring/shadow variable chain]**.
- Easing: `ease-out cubic-bezier(0,0,.2,1)`, `ease-in-out cubic-bezier(.4,0,.2,1)`, `ease-in-out-cubic cubic-bezier(.65,.05,.36,1)`, an expressive `cubic-bezier(.8,0,.5,1)` for width and transform reveals, default transition .15s. Keyframes include `fadeIn`, `slideUpAndFade`, `scaleIn`, `popUp`, `shine`, `fadeOutBlur`, `react-loading-skeleton`, and a homepage `spend-cli-timer` / `spend-cli-row` animation (a CLI-style spend demo).

**Structure and messaging [measured from page text]**
- Hero: a short, confident H1 ("Radically different banking"), one line of subhead, one CTA (email → apply), and the legal disclaimer right under the CTA ("Mercury is a fintech company, not an FDIC-insured bank…"). **Honesty sits next to the CTA, not hidden in the footer.**
- Then four product pillars, each a noun plus a one-sentence outcome ("Cards & expense management: … control team expenses with cards, reimbursements, limits, and approvals"). The nav now says "Issue cards instantly and control **team and agent spend**." Mercury itself is positioning for agent spend.
- Benefit headlines are verb-first and pain→gain: "Banking's been a headache. Now, it's a head start." / "Create cards in a couple of clicks" / "Watch bills pay themselves."
- Proof: customer quotes from founders (Linear, Supabase), then a numbers strip ("300K+", "1 in 3", "$20B+", "4.9").
- "Run your business like a seasoned pro": a four-up grid of Total visibility / Automations / Team management / Guidance, each one sentence.
- The security page is built on **specific mechanisms instead of adjectives**: "Uncompromising MFA … never settling for insecure options like SMS", "Robust ACH authorization: designate which vendors can initiate…", "Controls that keep you in control" (permissions, spend controls, receive-only accounts, payment requests), "Your data. Your eyes only.", and an FAQ that explains custody in plain language.
- Treasury page: a big number (4.00%), a plain table of tiers, and FAQ answers that put limits up front.

**How Mercury shows money [inferred, from product screenshots and marketing mockups]:** one dominant balance in large light-weight numerals with tabular figures, small muted currency or label above it, secondary accounts as quiet rows, transactions as dense single-line rows (avatar or icon · counterparty · muted meta · right-aligned amount, positive in green and negative in default text), and actions as a small row of pill/ghost buttons next to the balance.

### 1.2 Linear (linear.app) [measured from CSS]
- Dark backgrounds step `#08090a` → `#0f1011` → `#141516` → `#191a1b`. Text: `#f7f8f8`, `#d0d6e0`, `#8a8f98`, `#62666d`. Borders: `#23252a`, `#34343a`, `#3e3e44`, plus translucent `#ffffff0d` / `#ffffff14`. Accent `#7170ff` (hover `#828fff`), with a tint of `#18182f` for selected rows.
- Font: Inter Variable with weights 400 / 510 / 590 / 680. Mono: Berkeley Mono. UI text sizes are small: mini 13px, small 14px, regular 15px, large 17px.
- Radii 4 / 6 / 8 / 12 / 16 / 24 / 32 / pill. Shadows are heavier on dark (`0 4px 24px #0003`, `0 7px 32px #00000059`) and used only for floating layers.
- Easing family: `ease-out-quart cubic-bezier(.165,.84,.44,1)`, `ease-out-expo cubic-bezier(.19,1,.22,1)`.
- **Patterns to take:** keyboard-first (⌘K), dense list rows with hover tint, status pills with a small color dot, and labels that are always sentence case.

### 1.3 Squads (squads.so) [measured + inferred]
- Near-black `rgb(16,16,18)` / `rgb(17,17,19)` with white text, Inter for body and **Pixelify Sans** as a single playful accent face (Framer site). Product naming is short and branded (Altitude, Fuse, Grid, Multisig), each with a one-line value.
- Trust line placed like Mercury's: "Squads Labs is a financial technology company, not a bank or a digital asset custodian."
- **Patterns to take [inferred from the Squads multisig product]:** treat signatures as first-class UI. Show "who must sign, what changes, and what it will look like after" before you request a signature. Show addresses truncated as `4Hk2…9xQa` with copy and explorer buttons.

### 1.4 Ramp (ramp.com/expense-management) [measured from page text]
- "**Control spend before it happens.**" Policy is a feature that runs *before* spend, not a report afterwards.
- Vocabulary: limits, guardrails, block risky merchants or categories, approvals, "track spend vs. plan … what's spent and what's left", "full audit trail", and "locks cards so you don't have to play bad cop."
- **Patterns to take:** limit meters that show *spent / limit* and *remaining*, policy as readable rules ("Max 0.05 SOL per payment") instead of JSON, and a reason attached to every denial.

### 1.5 Vercel Geist (vercel.com/geist) [measured from docs]
- 10-step scales per hue with fixed jobs: 100 bg, 200 hover bg, 300 active bg, 400 border, 500 hover border, 600 active border, 700 high-contrast bg, 800 hover high-contrast bg, 900 secondary text, 1000 primary text. Use solid gray by default and alpha only where the background must show through. "Draw each border once." "Keep material shadows translucent."
- Materials: on-page surfaces use radius 6 (base/small) or 12 (medium/large). Floating layers: tooltip 6, menu 12, modal 12, fullscreen 16.
- Fonts: **Geist Sans + Geist Mono** (free, `geist` npm package or `next/font`).
- **Patterns to take:** deployment-style status rows (dot + label + relative time), a grid aesthetic on marketing, and calm, monospace-heavy technical surfaces.

### 1.6 Current Ringside dashboard audit (repo `apps/dashboard`, Oct 9)
- `globals.css` is plain CSS: bg `#09120f`, cards `#112019`, borders `#2b4835`/`#42624d`, accent `#b7f497`, text `#eaf2ed`. Accent, surface, and border are all green, so nothing reads as primary. Inter is referenced but never loaded.
- `page.tsx` is a single 103-line client component. Pairing (URL and token inputs) renders **above** all data. Tabs are `overview | activity | policy`. Policy is a raw JSON `<textarea>`. Confirmations use `window.confirm`. Empty states are one muted line ("No private balance yet.").
- Data it already has, keep these names: `Status { solana_address, shielded_address, registered, public_sol_balance, network, owner_pubkey, policy_version, policy, budget{spent_today, spent_session, max_per_day, max_per_session} }`, `Balance { asset, amount, amount_base_units, utxos }`, `Activity { signature, slot, kind, direction, asset, amount, amount_base_units }`.
- Control API (localhost, Bearer pairing token): `GET /v1/status`, `/v1/balances`, `/v1/activity`, `/v1/policy`, `/v1/events` (SSE), and `POST /v1/policy`, `/v1/kill`, `/v1/wallet/deposit`, `/v1/wallet/withdraw` (owner-signed envelope: `ringside-mcp:v1:{action,payload_sha256,nonce,issued_at,expires_at}` with a 60-second expiry).
- Policy schema (`packages/mcp/src/policy.ts`): `kill_switch`, `read_only`, `assets{ [asset]: {max_per_tx, max_per_session, max_per_day} }`, `asset_allowlist[]`, `recipient_allowlist[]`, `allowlist_mode: 'off'|'enforce'`, `allow_withdrawal_fallback`. `init` also writes `require_owner_approval_above`, but the zod schema strips it, so **no approval queue exists**. There is no auditor key field in the policy today.
- Error codes to map in UI: `KILL_SWITCH`, `POLICY_DENIED: read-only mode | asset is not allowed | recipient is not allowed | transaction cap exceeded | daily cap exceeded | session cap exceeded`, `ENGINE_UNAVAILABLE`, `RECIPIENT_NOT_REGISTERED`, `Invalid owner signature` (403), HTTP 401 (bad token).

---

## 2. Design principles

1. **The balance is the headline.** Every screen answers "how much can my agent spend, privately, right now?" in under a second. One number, large, tabular.
2. **Calm surfaces, one loud thing.** Neutral surfaces, one accent for the primary action, and red only for Stop spending. Color carries meaning, never decoration. (Mercury and Geist both run on this discipline.)
3. **Say exactly what is private.** Every place that shows a transfer also shows what an outside observer sees. The privacy model is a feature you explain, not a vibe you sell.
4. **Controls before spend.** Caps, allowlists, and the kill switch read as rules that run *before* the agent pays (from Ramp). Every denial shows which rule fired.
5. **Signatures are moments.** Every owner-signed action gets a review sheet: what changes, before → after, a 60-second expiry note, then the wallet prompt. Never use `window.confirm`.
6. **Show the machine.** The product is an MCP server for developers, so show real tool names, real error codes, a terminal snippet, and Geist Mono for technical strings, as Vercel and Linear do.
7. **Empty states teach.** Each empty state names the next action and the exact command (`ringside-mcp pair`, "Deposit devnet SOL").
8. **Honest status.** DEVNET BETA is always visible. Preview features (swap, escrow) are labeled. Verified-on-localnet versus devnet is stated in plain words.
9. **Mobile-first, desktop-dense.** One column at 360px with a thumb-reachable kill switch. On desktop, a two-column overview with dense tables.

---

## 3. Brand voice and copy rules

**Voice:** a precise, unhurried private banker who also writes good CLI help text. Confident without hype. Short declaratives.

**Rules**
1. **Sentence case** for every heading, button, tab, and label ("Stop spending", not "STOP SPENDING"). The only all-caps are the badges `DEVNET BETA` and `PREVIEW`, set with tracking.
2. **Verbs on buttons**, naming the outcome: "Sign policy change", "Stop spending", "Resume spending", "Deposit to private balance", "Withdraw to wallet", "Pair agent". Never use "Submit", "OK", or "Click here".
3. **Numbers carry units:** `0.05 SOL`. Show base-unit precision only in tooltips. Use tabular figures everywhere money appears.
4. **Privacy words, fixed glossary** (use these and nothing stronger):
   - "Private transfer": a Rings transfer where **amount and asset are hidden** on-chain.
   - "Public": visible to anyone on a Solana explorer.
   - "Shielded" may describe the balance/pool ("shielded balance"). **Never** say "anonymous", "untraceable", "invisible", "fully private", or "zero-knowledge anonymity".
   - Every privacy claim pairs with its limit: "Amounts and assets are hidden. Sender and recipient are public."
5. **Funding line (from the repo, keep it verbatim):** "**Funding is public; payments are private.**"
6. **Errors** state what happened, why, and what to do, in at most two sentences. Example: "Payment blocked: the daily cap of 0.5 SOL would be exceeded. Raise the cap in Policy or wait for the 24-hour window to roll."
7. **No exclamation marks**, no emoji in UI, no "seamless/revolutionary/next-gen".
8. **Agent-as-employee framing** (Mercury and Ramp language): the agent *spends*, the owner *sets limits*, *approves*, and *stops*. Use "owner" (not "admin") and "agent" (not "bot").
9. **Addresses:** first 4 and last 4 characters, `4Hk2…9xQa`, in mono, with copy and explorer actions. Never show a full address inline on mobile.
10. **Dates and times:** relative for under 24h ("3 min ago"), absolute otherwise ("Oct 9, 14:02"), with the full timestamp and timezone in a tooltip.

---

## 4. Design tokens (dark theme, the only theme for v1)

Implement as CSS variables in `app/globals.css` and map them into Tailwind v4 with `@theme inline`. Names follow shadcn conventions so components work unchanged.

### 4.1 Color

Neutral ramp: cool near-black, tinted toward blue-violet like Mercury's neutral base, darker than Mercury's `#171721` for OLED depth.

| Token | Hex | Use |
|---|---|---|
| `--bg` (background) | `#0B0B10` | Page |
| `--bg-subtle` | `#0F0F16` | Landing alternating sections, sidebar |
| `--surface-1` (card) | `#13131B` | Cards, sheets |
| `--surface-2` (muted) | `#1B1B26` | Inset wells, inputs, hover rows |
| `--surface-3` | `#242432` | Active/pressed, selected row |
| `--border-subtle` | `#1F1F2B` | Dividers inside cards |
| `--border` | `#2A2A3A` | Card and input borders |
| `--border-strong` | `#3A3A4E` | Hover borders, focus fallback |
| `--fg` (foreground) | `#F3F4F8` | Primary text, balances |
| `--fg-muted` | `#B3B5C6` | Secondary text |
| `--fg-subtle` | `#878A9C` | Labels, meta, placeholders |
| `--fg-disabled` | `#5B5D6E` | Disabled (decorative only) |

**Single accent: Ringside periwinkle** (lineage: Mercury purple-magic-400 `#9cb4e8`, Linear `#7170ff`).

| Token | Hex | Use |
|---|---|---|
| `--accent` (primary) | `#8B9BFF` | Primary buttons, links, focus ring, active tab indicator, chart line |
| `--accent-hover` | `#A3B0FF` | Hover |
| `--accent-press` | `#7383F0` | Active |
| `--accent-fg` | `#0B0B10` | Text on accent (contrast 7.7:1) |
| `--accent-tint` | `#8B9BFF1F` (12%) | Selected row, active nav background |
| `--accent-ring` | `#8B9BFF66` (40%) | Focus ring |

**Semantic colors.** Text values are tuned for dark backgrounds. The "bg" values are 12% alpha tints.

| Role | Text/icon | Tint bg | Border | Meaning |
|---|---|---|---|---|
| `--private` | `#6FD3E0` | `#6FD3E01F` | `#6FD3E04D` | Marks **hidden-on-chain** data only: private balance, "amount hidden" chip, shield icon. Never used for buttons. |
| `--success` | `#5BD69B` | `#5BD69B1F` | `#5BD69B4D` | Confirmed tx, incoming amount, "Agent connected" dot |
| `--warning` | `#F2B85B` | `#F2B85B1F` | `#F2B85B4D` | Approaching cap (≥80%), devnet banner, Preview badge, read-only mode |
| `--danger` | `#FF6B70` | `#FF6B701F` | `#FF6B704D` | Kill switch, policy denials, destructive confirm |
| `--danger-solid` | `#C9353B` | — | — | Filled "Stop spending" button bg (white text, 5.2:1) |
| `--public` | `#B3B5C6` (= fg-muted) | `#B3B5C61A` | `#B3B5C64D` | "Public" chip: deposits, withdrawals, addresses |

**Contrast check [computed, WCAG 2.x] on `--surface-1 #13131B`:** fg 16.8, fg-muted 9.1, fg-subtle 5.4, accent 7.2, private 10.6, success 10.2, warning 10.4, danger 6.7. All pass AA for body text. `--fg-disabled` (2.9) must never carry essential text.

**Rules:** no green surfaces. Success green appears only as small text, icons, or dots. The accent never fills an area larger than a button. Gradients are allowed only on the landing hero glow (accent at ≤12% alpha, radial) and on the private balance card edge highlight (§7.3).

### 4.2 Typography

| Role | Family | Source | Why |
|---|---|---|---|
| UI + display | **Geist Sans** (variable) | `geist` npm / `next/font` | Free stand-in for Mercury's Arcadia; Vercel-native |
| Editorial accent (landing only) | **Instrument Serif** (regular + italic) | Google Fonts | Free stand-in for Mercury's Tiempos italic accents; use for 1–3 words per headline at most |
| Mono | **Geist Mono** | `geist` | Addresses, signatures, tool names, code, error codes |

Fallback stacks: `"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` and `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace`.

Numerals: `font-variant-numeric: tabular-nums` on every amount, meter, and table numeric column (Mercury uses `"tnum"`). Use `slashed-zero` on mono addresses.

**Scale.** Mobile values first, desktop (`lg`) values after the arrow. Display sizes use Mercury-style clamps.

| Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display-xl` | `clamp(2.5rem, 1rem + 4.2vw, 5rem)` / 1.05 | 500 | -0.035em | Landing hero H1 |
| `display-lg` | `clamp(2rem, .9rem + 3vw, 3.5rem)` / 1.1 | 500 | -0.03em | Landing section H2 |
| `balance` | `clamp(2.5rem, 1.6rem + 3vw, 4rem)` / 1 | 400 | -0.04em | Private balance figure (light weight, as Mercury does) |
| `h1` | 24 → 28px / 1.2 | 600 | -0.02em | App page title |
| `h2` | 18 → 20px / 1.3 | 600 | -0.01em | Card title |
| `h3` | 15 → 16px / 1.4 | 600 | 0 | Sub-section |
| `body-lg` | 17 → 18px / 1.55 | 400 | 0 | Landing paragraphs |
| `body` | 15px / 1.5 | 400 | 0 | App default (Linear 15px) |
| `body-sm` | 13px / 1.45 | 400 | 0.005em | Meta, helper text |
| `label` | 12px / 1.3 | 500 | 0.02em | Field labels, stat labels (sentence case, **not** uppercase) |
| `overline` | 11px / 1.2 | 600 | 0.08em uppercase | Badges only (DEVNET BETA, PREVIEW) |
| `mono` | 13px / 1.5 | 400 | 0 | Addresses, code |
| `mono-sm` | 12px / 1.4 | 400 | 0 | Signatures in rows |

Body weight on dark: use 400, not 300, because thin strokes bloom on dark. Headings at 500–600. Avoid 700+ outside the logo wordmark.

### 4.3 Spacing (4px base; Mercury uses a pixel scale from 4)

`0, 1px, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128` (Tailwind defaults cover these).
- In-card padding: 16 on mobile, 24 at `md+`. Hero balance card padding: 24 mobile, 32 desktop.
- Gap between cards: 12 mobile, 16 desktop.
- Landing section padding Y: 64 mobile → 96 `md` → 128 `lg` (Mercury steps from 80 to 128 by breakpoint).
- Row heights: activity row 56px (mobile 64px with two lines), table row 44px, input/button 40px (36px for compact, 44px for primary touch on mobile).

### 4.4 Radius (Geist materials + Mercury steps)

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 4px | Chips inside rows, kbd |
| `--radius-sm` | 6px | Buttons (compact), inputs, tooltips |
| `--radius-md` | 8px | Buttons default, segmented controls |
| `--radius-lg` | 12px | Cards, menus, dialogs |
| `--radius-xl` | 16px | Hero balance card, sheets, landing feature cards |
| `--radius-2xl` | 24px | Landing hero visual frame |
| `--radius-full` | 9999px | Badges, status pills, avatar |

shadcn `--radius: 0.5rem` (8px). Derive the other steps from it.

### 4.5 Borders and elevation

Depth on dark comes from **surface steps + 1px borders + a top inner highlight**, not drop shadows (Mercury, Geist "keep shadows translucent").
- Card: `bg surface-1`, `border 1px var(--border)`, `box-shadow: inset 0 1px 0 0 rgb(255 255 255 / 0.04)`.
- Hover (interactive cards/rows): border goes to `--border-strong`, bg to `surface-2`, 150ms.
- Floating (menus, popovers, dialogs, sheets): `box-shadow: 0 8px 32px rgb(0 0 0 / 0.45), 0 0 0 1px var(--border)`. These are Linear's dark shadow-high values.
- Dialog overlay: `rgb(5 5 8 / 0.7)` + `backdrop-filter: blur(6px)`.
- Focus: `outline: 2px solid var(--accent); outline-offset: 2px` or `ring-2 ring-[--accent-ring] ring-offset-2 ring-offset-[--bg]`.
- Draw each border once: inside a card, divide rows with `--border-subtle` and never double up with the card border (Geist rule).

### 4.6 Iconography
`lucide-react`, 16px in rows, 20px in buttons and nav, stroke 1.75. Key icons: `ShieldCheck` (private), `Eye`/`EyeOff` (public/hidden), `Octagon`/`Power` (kill), `ArrowDownToLine` (deposit), `ArrowUpFromLine` (withdraw), `Send` (transfer out), `Inbox` (transfer in), `ReceiptText` (seller verify), `Repeat` (swap, Preview), `Lock` (escrow, Preview), `PlugZap` (pairing), `KeyRound` (signature), `ScrollText` (policy), `ExternalLink`.

---

## 5. Layout, grid, breakpoints

Mobile-first with Tailwind default breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Design at 360, 768, 1280.

**Landing:** container `max-w-[1200px] px-5 md:px-8`. 4 columns on mobile, 8 at `md`, 12 at `lg`, with gutter 16 → 24 → 32. Text column max 640px (~65ch).

**App shell:**
- `< lg`: top bar (56px) + content + **bottom tab bar** (64px, safe-area padding) with Overview · Activity · Policy · More. "More" holds Auditor and Connection.
- `≥ lg`: left **sidebar 240px** (logo, nav, connection status at the bottom) + top bar (56px) + content `max-w-[1120px] px-8`.
- Overview grid at `≥ lg`: 12 columns. Balance hero spans 8, Controls card (kill switch + limits) spans 4, then Activity preview 8 + Agent card 4.
- At `md`: 2 columns. Below `md`: single column in priority order: Devnet banner → Balance hero → Kill switch → Limits → Recent activity → Agent card.

---

## 6. Landing page spec

> Routing decision: move the dashboard to **`/app`** (with `/app/audit`) and put the landing page at `/`. Keep a redirect from `/audit` → `/app/audit` so existing links keep working. If time is short, ship the landing page at `/home` and leave the dashboard at `/`.

Global landing chrome:
- **Nav (sticky, 64px, blurred `bg/80`)**: wordmark "Ringside" + `DEVNET BETA` pill · links: How it works, Tools, Controls, Privacy, Docs (README) · right: "GitHub" (ghost, with star icon) + **"Open dashboard"** (accent). On mobile, a sheet menu.
- Section rhythm alternates `--bg` and `--bg-subtle`, with a 1px `--border-subtle` top border on each section.

### 6.1 Hero
- Layout: on mobile the text is stacked above the visual. At `lg`, 6/6 columns, text left and visual right.
- Overline pill: `● Built on Helius Privacy · Solana Rings` (private-cyan dot).
- **H1 options** (pick 1; the `<em>` is the Instrument Serif italic):
  1. "Let your agent pay. *Privately.*" **(recommended)**
  2. "Private payments for agents. *Controls* for owners." (this is the repo's existing tagline)
  3. "Your agent's wallet, with a *banker's* discretion."
- **Subhead:** "Ringside is an MCP server that lets AI agents send private payments on Solana. Amounts and assets stay hidden on-chain. You set the limits, sign every policy change, and can stop spending in one tap."
- **CTAs:** primary "Open dashboard" → `/app`. Secondary (ghost, mono) is a click-to-copy command: `git clone github.com/mayorXBT/Ringside-MCP`. Tertiary text link: "Read the privacy model ↓".
- **Honesty line under the CTAs** (Mercury-style placement, `body-sm fg-subtle`): "Devnet beta. Default private transfers hide amount and asset; sender, recipient, deposits and withdrawals are public. Test funds only."
- **Visual:** a static-first composite of (a) the **Private balance card** (from the app, real component, seeded demo data: `0.051 SOL · private`, `1.3 TEST`) overlapping (b) a terminal card that types an MCP exchange:
  ```
  > private_transfer { to: "79AR…Er9J", amount: "0.003", asset: "SOL" }
  ✓ policy ok · 0.003 / 0.05 SOL per tx
  ✓ sent privately · sig 52yc…H1a9
  ```
  Under it, an "On the explorer" strip: `From 4Hk2…  To 79AR…  Amount ••••  Asset ••••`. The bullets use the private chip. Motion: §9.

### 6.2 Proof strip (thin, directly under the hero)
Four facts in mono, separated by dividers (Mercury's numbers-strip pattern, made honest): `25 MCP tools` · `Owner-signed policy` · `402 → pay → verified` · `Keys stay local`. No vanity user counts.

### 6.3 How it works (4 steps)
Horizontal stepper at `lg`, vertical timeline on mobile. Each step has a number, title, one sentence, and a mono detail.
1. **Install the server.** "Run Ringside next to your agent. Claude Desktop, Claude Code, Cursor, any MCP client." `ringside-mcp init --owner <your wallet>`
2. **Fund the agent wallet.** "Deposit devnet SOL into the agent's private balance. Deposits are public on-chain." `deposit`
3. **Set the rules.** "Caps per payment, per session and per 24 hours, an allowlist, and a kill switch, signed by your owner wallet." `/v1/policy (owner-signed)`
4. **Let it pay.** "The agent pays sellers privately. Amount and asset stay hidden; you see everything in the dashboard." `private_transfer`

### 6.4 MCP tool showcase
- H2: "One MCP server. Every money verb your agent needs."
- A tabbed or segmented control: **Wallet · Spend · Seller · Owner · Swap & escrow (Preview)**. Each tab shows tool cards in a grid (mono tool name, one-line description, an annotation chip: `read` (public-muted) or `spends funds` (warning)).
  - Wallet: `wallet_info`, `register_private_wallet`, `deposit`, `sync_balance`, `read_history` (aliases `create_private_wallet`, `get_private_balance`, `get_private_history` shown as "also: …").
  - Spend: `private_transfer`, `withdraw`, `deposit_with_interface_setup`, `create_test_token`.
  - Seller: `create_payment_request`, `pay_payment_request`, `verify_payment`.
  - Owner: `get_policy` (read-only; "Agents can read policy. Only your wallet can change it.").
  - Swap & escrow: `swap_make_order`, `swap_take_order`, `swap_take_order_verifiable`, `swap_cancel_order`, `swap_list_orders`, `escrow_lock`, `escrow_release`, `escrow_withdraw`, `escrow_list`. A `PREVIEW` badge plus the banner: "Listed and discoverable. The Ringside engine returns `ENGINE_UNAVAILABLE` today; upstream swap and escrow programs pass on localnet. Don't lock funds."
- Right side at `lg`: a live-looking JSON response panel for the selected tool (static fixtures).

### 6.5 Owner controls (Ramp-style "control spend before it happens")
- H2: "Rules run before your agent spends."
- Three feature cards with mini-UI illustrations built from real components:
  1. **Spend caps**: a limit meter "0.12 of 0.5 SOL today", plus "Per payment 0.05 · Per session 0.2 · Per 24h 0.5".
  2. **Allowlists**: assets (SOL) and recipients, with mode `Enforce` shown as a switch.
  3. **Stop spending**: the kill switch button, with the line "One signature. The next payment is rejected with `KILL_SWITCH`." Also mention `ringside-mcp kill` for local emergency use.
- A strip below: "Every change is signed by your owner wallet (ed25519, nonce, 60-second expiry). Agents have no tool that can change policy."

### 6.6 Sellers: verify_payment (x402-style)
- H2: "Charge agents. Verify privately."
- A sequence diagram drawn as 4 horizontal cards connected by a line (vertical on mobile):
  `GET /report` → **402 Payment Required** (payment request: asset, amount, nonce, expiry) → agent `pay_payment_request` (private transfer) → retry with `X-PAYMENT` → `verify_payment` → **200 OK**. Then a 5th, muted card: replay attempt → **rejected**.
- What's checked (a checklist with ✓ icons): amount, asset, payer, expiry, replay. Honest footnote: "No on-chain memo binds the nonce yet, so the verifier also rejects payments older than the request."
- Code tab: `examples/seller-api` handler excerpt (see §6.9).

### 6.7 Privacy model (most important trust section; a Mercury-security-page pattern)
- H2: "Exactly what's private. Exactly what isn't."
- **Two-column table** (stacks to cards on mobile). Column headers: "Hidden on-chain" (private-cyan, `EyeOff`) and "Public on-chain" (public-muted, `Eye`).

| Action | Hidden | Public |
|---|---|---|
| Private transfer (default ring) | Amount, asset | Sender, recipient, signature, timing |
| Deposit into private balance | — | Wallet, amount, asset |
| Withdraw to a public wallet | — | Recipient, amount, asset |
| Seller payment (402 flow) | Amount, asset | Payer, seller, signature |
| Your policy and caps | Stays on your agent's machine (not on-chain) | — |

- Below the table, three small cards:
  - "**Keys stay local.**" The agent keypair is created with mode 600 and is never returned by any tool or API.
  - "**Localhost control.**" The control API binds 127.0.0.1 and needs a pairing token for reads and your owner signature for writes.
  - "**Devnet only.**" Mainnet RPC URLs are refused. Use test funds.
- Footnote: "Funding is public; payments are private. Sizes and timing of deposits and withdrawals can still reveal patterns, so fund in round amounts and don't withdraw immediately after paying." (Keep this practical; do not overpromise.)

### 6.8 Built on Helius
- A logo row: Helius, Solana, Solana Rings (zolana), MCP. Use monochrome `fg-subtle` logos and get each logo's usage permission; if unsure, use text wordmarks in Geist Mono.
- Copy: "Built on Helius Privacy: Solana Rings private balances, Photon indexing and proving. Ringside adds an MCP surface, owner controls and seller verification."

### 6.9 Code snippet section
- H2: "Five minutes to a private-paying agent."
- Tabs: **Claude Desktop config** · **CLI** · **Seller API**. Use a Geist Mono code block with a copy button and `surface-2` background. Syntax colors use only fg, fg-muted, accent, and private-cyan.
  - Claude Desktop (from the README):
    ```json
    {
      "mcpServers": {
        "ringside": {
          "command": "node",
          "args": ["--use-env-proxy", "/absolute/path/Ringside-MCP/packages/mcp/dist/index.js"],
          "env": { "HELIUS_API_KEY": "your-devnet-key", "RINGSIDE_KEYPAIR": "/absolute/path/agent.json" }
        }
      }
    }
    ```
  - CLI: `pnpm install && pnpm build` → `node packages/mcp/dist/index.js init --owner <OWNER>` → `… pair`.
  - Seller: the 402 / `X-PAYMENT` / `verifyPayment` handler from `examples/seller-api/index.mjs` (trimmed).
- Note under the block: "Built from source today; `npx ringside-mcp` isn't published yet."

### 6.10 FAQ (accordion; Mercury puts FAQ on its trust pages)
1. *Is Ringside on mainnet?* "No. Devnet beta. Mainnet URLs are refused by the server."
2. *What exactly is hidden?* "Amount and asset of private transfers. Sender, recipient and signature are public. Deposits and withdrawals are fully public."
3. *Can my agent change its own limits?* "No. There's no policy-writing MCP tool. Changes need a signature from your owner wallet."
4. *What happens when I press Stop spending?* "Your wallet signs a kill-switch change; the agent's next spend is rejected with `KILL_SWITCH`. Reads still work."
5. *Where are the keys?* "On the agent's machine, in `~/.ringside` (mode 600). The dashboard never sees them."
6. *Do swap and escrow work?* "Not yet in Ringside. The tools are listed and return `ENGINE_UNAVAILABLE`; upstream programs pass on localnet."
7. *What's verified today?* "Deposit → private transfer → seller verify → withdrawal passes on Zolana localnet. On devnet, registration and deposits pass; private transfer is waiting on Helius proof services."
8. *Does the dashboard work from the hosted URL?* "Yes, in Chrome, with the site's origin added to `RINGSIDE_DASHBOARD_ORIGINS`. It talks to your local agent at 127.0.0.1:7420."

### 6.11 Final CTA band
"Give your agent a wallet you can trust it with." Buttons: **Open dashboard** · **View on GitHub**.

### 6.12 Footer
Wordmark + "Private agent payments on Solana." · columns: Product (Dashboard, Auditor view, Tools), Developers (GitHub, README, Security model, Demo runbook), Built for (Colosseum World's Fair). The legal/honesty line is mandatory (Squads/Mercury pattern): "Ringside is experimental software on Solana devnet. Not a bank, custodian or wallet provider. Use test funds only. MIT licensed."

---

## 7. App spec, screen by screen

### 7.0 App states (drive the whole UI from these)
`walletState: disconnected | connecting | connected-owner | connected-not-owner`
`agentState: unpaired | connecting | online | offline(error) | unauthorized(401)`
`policy.kill_switch: boolean`, `policy.read_only: boolean`
Network: `devnet | localnet` (from `status.network`).

### 7.1 Devnet banner (global, above the top bar)
- 32px-tall full-width strip, `warning` tint bg, warning text, `body-sm`: "**Devnet beta.** Test funds only. Private transfers hide amount and asset; deposits and withdrawals are public. [Privacy model]". For localnet: "**Localnet.** Connected to a local Zolana stack."
- Dismissible per session (store in sessionStorage). The `DEVNET BETA` pill in the top bar stays even when the banner is dismissed.

### 7.2 Top bar
- Left (mobile): wordmark (on desktop it lives in the sidebar) + `DEVNET BETA` pill (`overline`, warning-tint bg, warning text, warning border).
- Center (desktop): page title.
- Right: **Agent status pill**, which also opens the Connection drawer: `● Agent online` (success dot, with a 2s pulse once on reconnect), `● Offline` (danger dot), or `○ Not paired` (fg-subtle). Then the **wallet button**: disconnected shows "Connect owner wallet" (accent); connected shows an avatar dot + `4Hk2…9xQa` with a menu (Copy address, View on explorer, Disconnect). If connected but not the owner, show a warning-colored dot plus the tooltip "This wallet isn't the agent's owner. You can view, not sign."
- ⌘K command menu (shadcn `Command`): Go to Activity/Policy, Stop spending, Deposit, Withdraw, Copy agent address, Open Connection.

### 7.3 Hero: Private balance card (`<PrivateBalanceCard>`)
The most important component. `radius-xl`, `surface-1`, a 1px border plus a 1px top gradient edge (`linear-gradient(90deg, transparent, var(--private) 40%, var(--accent) 60%, transparent)` at 35% opacity), padding 24/32.
- Label row: `ShieldCheck` (private) + "Private balance" (`label`, fg-muted) + chip `Amount hidden on-chain` (private tint), with an info tooltip explaining "Decrypted locally by your agent. Outside observers can't see this amount."
- **Figure:** primary asset (SOL) in the `balance` style, `tabular-nums`, with the unit `SOL` at 50% size in fg-muted. For multiple assets, show the first as the hero and the rest as rows below (`asset · amount · n notes`, where "notes" = `utxos` and the tooltip says "Private notes (UTXOs) that make up this balance").
- **Privacy toggle** (eye icon button): masks the figures as `••••` for screen-sharing in demos. Persist in localStorage. Default is unmasked.
- Sub-row: "Public SOL (fees) **0.84 SOL**" with a `Public` chip. This is the agent wallet's public balance, used for fees.
- Actions (right-aligned at `md+`, full-width 2-up on mobile): **Deposit** (accent) and **Withdraw** (secondary). Both open the Move funds sheet (§7.9). Disabled with a tooltip unless `connected-owner`.
- Footer meta: "Synced 4s ago · live" with an SSE indicator. If SSE drops, show "Polling every 5s".
- **Kill-switch ON state:** the card gets a 1px danger border and an inline banner inside the top of the card: "Spending stopped. Your agent can read balances but can't pay. [Resume spending]".

### 7.4 Overview (`/app`)
Order and layout as in §5. Cards:
1. `PrivateBalanceCard` (hero).
2. **Controls card** (`<SpendControlsCard>`):
   - Kill switch block (§7.8): status line "Spending allowed" (success dot) or "Spending stopped" (danger dot), plus the button.
   - Limit meters (`<LimitMeter>`): "Today (rolling 24h)" `spent_today / max_per_day SOL`, and "This session" `spent_session / max_per_session`. The bar is accent below 80%, warning at 80–99%, and danger at 100%. Under each: "0.38 SOL left".
   - Rule summary: "Max per payment 0.05 SOL · Allowlist off · Read-only off" with an "Edit policy →" link.
3. **Recent activity** (5 rows of `ActivityRow`, then "View all").
4. **Agent card** (`<AgentCard>`): agent wallet `solana_address` (mono, truncated, copy, explorer), shielded address (`shielded_address`, truncated, copy), registration status ("Private wallet registered" success / "Registration pending" warning), network, policy version `v3`, MCP tools "25 tools · 9 Preview".

### 7.5 Activity (`/app/activity`)
- Header: "Activity", with a filter segmented control: All · Sent · Received · Deposits · Withdrawals (maps to `kind`/`direction`), and an asset filter.
- Desktop: a table (`Date`, `Type`, `Counterparty / details`, `Privacy`, `Amount`, `Tx`). Mobile: a list of `ActivityRow`.
- **`ActivityRow` anatomy** (56px, Mercury-style dense row):
  - Left: 32px round icon tile, `surface-2`, with the kind icon (Send / Inbox / ArrowDownToLine / ArrowUpFromLine).
  - Title: humanized kind ("Private payment sent", "Private payment received", "Deposit", "Withdrawal"). Subline: relative time · `slot 509,084,400` (fg-subtle, mono-sm).
  - Privacy chip: `Private · amount hidden` (private tint) for transfers, `Public` (public chip) for deposits and withdrawals.
  - Right: amount, `tabular-nums`, `−0.003 SOL` in fg for outgoing and `+0.003 SOL` in success for incoming. Below it, `52yc…H1a9 ↗` in mono-sm, linking to the explorer (devnet or localnet custom URL, the logic that exists today).
  - Hover: `surface-2` bg. Click: opens a **detail sheet** with full signature (copy), slot, and kind, plus a "**What the explorer shows**" panel listing `amount: hidden` and `asset: hidden` for private transfers.
- Header note (one line, fg-subtle): "Amounts are decrypted locally by your agent. Public explorers don't show private transfer amounts."
- Live insert: new rows (from SSE) slide in at the top and get a 1.5s accent-tint flash.

### 7.6 Policy (`/app/policy`): a form, not JSON
Replace the textarea with a **structured editor**. Keep "Advanced (JSON)" as a collapsible tab for power users.
- Header: "Policy" + `v{policy_version}` chip + "Only your owner wallet can change these rules. The agent's next request uses the new policy."
- Sections (each a card with rows: label + description left, control right):
  1. **Spending**: "Stop spending" (mirror of the kill switch, links to the same flow) and "Read-only mode" (switch; "Agent can read balances and history but can't move funds").
  2. **Limits per asset**: a table with one row per `assets[asset]` and columns *Per payment*, *Per session*, *Per 24 hours* (decimal inputs with the asset suffix). "Add asset limit" button. Validate positive decimals and per_tx ≤ per_session ≤ per_day (warn, don't block, if violated).
  3. **Allowed assets**: a tag input for `asset_allowlist` (SOL default; mint addresses truncated).
  4. **Recipients**: a mode segmented control `Off · Enforce` (`allowlist_mode`) and a list of `recipient_allowlist` addresses with labels (label stored locally only), add or remove. With Enforce on and an empty list, show the warning "No recipients allowed. Every payment will be blocked."
  5. **Safety**: `allow_withdrawal_fallback` switch, default off, with the description "If a recipient isn't registered for private payments, allow a **public** withdrawal to them instead. Off is safer." A danger-tinted description is shown when on.
  6. **Auditor access** (requested by Mayor; not in the schema today): render a card titled "Auditor viewing key" with state **Coming soon** (Preview badge), copy "Share read-only access to balances and history with an auditor. Today, auditors use a pairing token on the Auditor view." and a link to Auditor view. Do **not** build a fake key field. If a future API exposes `auditor_pubkey`, this becomes an address input with an owner-signed save.
- **Sticky save bar** (bottom; appears when dirty): "3 changes" · Discard · **Review and sign** (accent).
- **Review sheet** (Dialog on desktop, bottom Sheet on mobile): a before → after **diff list** with human labels ("Per 24 hours (SOL): 0.5 → 1.0") with removed values struck through in danger and added ones in success. Then a signing explainer: `KeyRound` "Your wallet will sign a message (no transaction, no fee). Expires in 60 seconds." Button: "Sign policy change". States: awaiting wallet (spinner, "Approve in Phantom"), success (toast "Policy v4 is live"), and errors (403 → "Signature rejected: the connected wallet isn't the owner, or the request expired. Try again.").

### 7.7 Pairing: onboarding stepper + Connection drawer
**First run** (no token in localStorage) shows a centered **onboarding stepper** (`<OnboardingStepper>`, max-w 560) instead of the dashboard:
1. **Run your agent.** "Start Ringside MCP on the machine your agent runs on." A copyable code block: `node packages/mcp/dist/index.js init --owner <your wallet>`. A "Already done" link skips ahead.
2. **Get a pairing token.** Copyable `ringside-mcp pair` (or `node packages/mcp/dist/index.js pair`). "It prints a token. Keep it secret: it grants read access."
3. **Connect.** Fields: Control API URL (default `http://127.0.0.1:7420`, collapsed under "Advanced" unless edited) and Pairing token (password input with a show toggle). Button "Pair agent". It runs `GET /v1/status`. Success shows a check, "Paired with 4Hk2…9xQa", then auto-advance. 401 shows "That token didn't work. Run `pair` again and paste the new one." Network failure shows a troubleshooting accordion: agent running? `RINGSIDE_DASHBOARD_ORIGINS` includes `https://ringside-dashboard.vercel.app`? Using Chrome (HTTPS → localhost)?
4. **Connect owner wallet.** "Connect the wallet you passed to `--owner`." Phantom button. If the address ≠ `owner_pubkey`, show a warning: "This isn't the owner wallet (expected 7xQ…a2). You can still view." Provide "Skip, view only".
- Stepper visuals: numbered circles (accent when active, success check when done), 1px connector line, step content slides in (§9).

**Afterwards**, pairing lives in the **Connection drawer** (`Sheet` from the right on desktop, bottom on mobile), opened from the agent status pill or Settings: URL, token (masked, "Replace token"), last sync, SSE status, "Disconnect agent" (clears localStorage, with a confirm), and the troubleshooting accordion.

### 7.8 Kill switch with confirm (`<KillSwitchButton>` + `<KillSwitchDialog>`)
- Button when spending is allowed: **"Stop spending"**, `danger-solid` bg, white text, `Octagon` icon, height 44, full width in the Controls card. On mobile it's also reachable from the bottom tab bar's "More" sheet as the first item.
- Click → **AlertDialog**: title "Stop all agent spending?", body "Your agent's next payment, transfer or withdrawal will be rejected with `KILL_SWITCH`. Balances and history stay readable. You can resume anytime with another signature." Buttons: Cancel (secondary, autofocus), **"Sign and stop spending"** (danger).
- Then the wallet prompt → optimistic UI: the status flips to "Stopping…" and is confirmed by the `/v1/status` refetch or the SSE `policy.kill` event.
- When stopped: a global danger strip under the devnet banner reads "Spending stopped · since 14:02 [Resume spending]". The button becomes **"Resume spending"** (secondary with a success icon). Resume also needs a confirm: "Resume spending within your current limits?"
- Disabled (not owner): the button is visible but disabled, with the tooltip "Connect the owner wallet to stop spending. Emergency: run `ringside-mcp kill` on the agent machine."

### 7.9 Deposit / withdraw (`<MoveFundsSheet mode="deposit|withdraw">`)
- Sheet with a segmented control at the top: Deposit · Withdraw.
- Persistent **public notice** at the top (public chip + Eye icon): "Deposits and withdrawals are public on-chain: anyone can see the wallet, amount and asset." For withdrawals: "Withdrawals are public. To pay someone privately, have your agent use `private_transfer`."
- Fields: Asset (select from `asset_allowlist` and current balances; default SOL), Amount (large input with `tabular-nums`, "Max" chip for withdraw = private balance; validate `^(0|[1-9]\d*)(\.\d+)?$` and > 0), and for Withdraw a "To" field (default "Agent wallet (4Hk2…)", or paste an address, validated as base58 32–44 chars).
- Explainer row: "The agent wallet pays the fee and holds funds. Your owner wallet only signs to approve."
- Summary box before signing: "Deposit 0.01 SOL from agent wallet → private balance · Public on-chain · Signs with 4Hk2…" CTA "Sign deposit" / "Sign withdrawal".
- Progress states: Signing → Submitting → Confirmed (show signature + explorer link + "Balance updates in a few seconds"). The balance figure animates the change (§9).
- Errors map to plain text, e.g. insufficient public SOL for fees → "The agent wallet needs a little public SOL to pay fees."

### 7.10 Auditor view (`/app/audit`, read-only)
- Same shell with a `VIEW ONLY` badge (public chip style) in place of wallet actions. No kill switch and no Policy nav, with the line "This view can read balances and history. It has no policy or payment controls."
- Pairing: the same stepper reduced to step 3 (URL + token). The token is stored under a separate localStorage key from the owner's.
- Content: Private balance card (no actions), Activity table (same rows), and a "Policy snapshot" (read-only list of the current rules from `GET /v1/policy`).
- An "Export CSV" button (client-side from `/v1/activity`) is a nice-to-have for the demo.
- Note: "Browser-side viewing-key decryption is not available yet. This view reads through the agent's local control API."

### 7.11 Empty, loading, error states
| Surface | Empty | Loading | Error |
|---|---|---|---|
| Whole app, unpaired | Onboarding stepper (§7.7) | — | — |
| Balance card | "No private balance yet." + "Deposit devnet SOL to give your agent something to spend." + **Deposit** button (or, if not owner, "Ask the owner to deposit") + a small illustration: an outlined ring | Skeleton: label bar 120px, figure bar 200×40, two action pills. Shimmer 1.5s (Mercury `react-loading-skeleton` timing) | "Couldn't reach your agent. Last balance shown from 3 min ago." Keep stale data dimmed at 60% with a "Retry" link |
| Activity | Icon tile + "No payments yet." + "When your agent pays or gets paid, it shows up here within seconds." + a mono hint: "Try: ask your agent to run `wallet_info`." | 5 skeleton rows | Inline alert with retry |
| Policy | — | Form skeleton | Load fail: "Couldn't load policy." Save fail: maps to 403 / expired / network |
| Limits | If `budget` is null: "No spending tracked yet this session." | Meter skeleton | — |
| Agent offline | Status pill turns danger; toast once: "Agent offline. Retrying every 5s." Content stays (stale) with a "Last synced" time | — | — |
| 401 | Banner: "Pairing token rejected. [Re-pair]" opens the Connection drawer | — | — |
| Wrong wallet | Warning banner in Controls: "Connected wallet isn't the owner. Actions are view-only." | — | — |
| Policy denial events | If the activity or event stream carries a denial, show a danger toast with the rule: "Blocked: daily cap exceeded (0.5 SOL)." | — | — |

Error-code → copy map (put in `lib/errors.ts`):
- `KILL_SWITCH` → "Spending is stopped by the owner."
- `POLICY_DENIED: transaction cap exceeded` → "Over the per-payment cap."
- `…daily cap exceeded` → "Over the 24-hour cap." / `…session cap exceeded` → "Over the session cap."
- `…asset is not allowed` → "This asset isn't on the allowlist." / `…recipient is not allowed` → "This recipient isn't on the allowlist." / `…read-only mode` → "Read-only mode is on."
- `RECIPIENT_NOT_REGISTERED` → "Recipient hasn't set up a private wallet, so a private payment isn't possible."
- `ENGINE_UNAVAILABLE` → "Swap and escrow aren't available in this release."
- `Invalid owner signature` → "Signature rejected. Connect the owner wallet and try again within 60 seconds."

### 7.12 Swap and escrow surfaces
Not in the app nav for v1. If shown, place them in Overview → Agent card → "Tools" list with a `PREVIEW` badge and the tooltip "Returns `ENGINE_UNAVAILABLE` in this release." **No buttons that look actionable.**

---

## 8. Component library

Install: `tailwindcss@4`, `@tailwindcss/postcss`, shadcn/ui (`npx shadcn@latest init`, style "new-york", base color "neutral", CSS variables on; then override tokens with §4), `lucide-react`, `motion`, `geist`, `sonner` (toasts), `class-variance-authority`, `clsx`, `tailwind-merge`. This is compatible with Next 16 / React 19 in `apps/dashboard`. Remove the old global element styles in `globals.css` (`button{…}`, `input{…}`), because they would fight shadcn.

**shadcn primitives:** Button, Badge, Card, Dialog, AlertDialog, Sheet, Drawer (vaul, for mobile), Tabs, ToggleGroup (segmented), Switch, Input, Label, Form (react-hook-form + zod; zod is already used server-side), Select, Tooltip, Popover, DropdownMenu, Command, Accordion, Table, Skeleton, Separator, Progress (restyled as LimitMeter), ScrollArea, Sonner.

**Ringside components** (`components/ringside/*`):
| Component | Notes |
|---|---|
| `AppShell` | Sidebar (lg+) / bottom tabs (<lg), top bar, banners slot |
| `DevnetBanner` | §7.1 |
| `KillStrip` | Global "Spending stopped" strip |
| `NetworkBadge` | `DEVNET BETA` / `LOCALNET` / `VIEW ONLY` |
| `AgentStatusPill` | online / offline / unpaired / unauthorized; opens ConnectionDrawer |
| `WalletButton` | Phantom adapter; owner / not-owner states |
| `PrivateBalanceCard` | §7.3; `masked` prop |
| `AmountDisplay` | Formats decimals, tabular, unit, sign, color by direction; `size: hero/row/inline` |
| `PrivacyChip` | `variant: private / public / hidden` |
| `AddressPill` | Truncate, copy, explorer link (devnet/localnet aware) |
| `LimitMeter` | spent / max, remaining, threshold colors |
| `SpendControlsCard` | Kill switch + meters + rule summary |
| `KillSwitchButton` + `KillSwitchDialog` | §7.8 |
| `ActivityRow`, `ActivityTable`, `ActivityDetailSheet` | §7.5 |
| `PolicyForm`, `LimitsTable`, `AllowlistEditor`, `PolicyDiff`, `SignReviewDialog` | §7.6 |
| `MoveFundsSheet` | §7.9 |
| `OnboardingStepper`, `ConnectionDrawer` | §7.7 |
| `EmptyState` | icon, title, body, action, optional code hint |
| `CodeBlock` | Geist Mono, copy button, tabs |
| `CommandMenu` | ⌘K |
| Landing: `Hero`, `TerminalDemo`, `ExplorerStrip`, `HowItWorks`, `ToolShowcase`, `ControlsShowcase`, `SellerFlow`, `PrivacyTable`, `BuiltOn`, `FAQ`, `SiteFooter` | §6 |

**Data layer:** extract `request`, `refresh`, the SSE reader, and `signedWrite` from `page.tsx` into `lib/control-client.ts` and a `useRingside()` hook (status, balances, activity, policy, connection state, `signAndPost`). Keep the canonical-JSON + SHA-256 envelope format **byte-identical**, because the server verifies it.

---

## 9. Motion rules

Motion confirms state; it never decorates. Use Mercury's restraint (.15s default) with Linear's easing curves.

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120ms | Hover, press, color |
| `--dur-base` | 200ms | Tooltips, chips, tab indicator |
| `--dur-slow` | 320ms | Sheets, dialogs, stepper transitions |
| `--dur-number` | 600ms | Balance count transitions |
| `--ease-out` | `cubic-bezier(.165,.84,.44,1)` (out-quart) | Entrances |
| `--ease-in-out` | `cubic-bezier(.65,.05,.36,1)` (Mercury in-out-cubic) | Moves, layout |
| `--ease-expo` | `cubic-bezier(.19,1,.22,1)` | Number roll, hero reveal |

- **Entrances:** fade + 8px translateY, 200–320ms. Stagger lists at 30ms per item, max 8 items.
- **Balance change:** digits roll (or crossfade per digit) over 600ms with ease-expo, plus a one-time 1s tint flash: success for an increase, fg-muted for a decrease. Never loop.
- **New activity row:** height expands from 0 and fades, 240ms, then a 1.5s accent-tint background fade.
- **Kill switch:** no bouncy motion. On stop, the danger strip slides down (200ms) and the card border animates to danger (200ms).
- **Private chip "veil":** on the landing hero only, amounts in the explorer strip resolve from digits to `••••` with a 400ms blur-to-mask (Mercury has `fadeOutBlur`). This happens once, on enter.
- **Terminal demo:** types at 18ms per character, lines pause 400ms, plays once on scroll-into-view, then shows a "Replay" button. No infinite loops.
- **Sheets/dialogs:** shadcn defaults, overlay fade 200ms, content scale .96→1 + fade (dialog) or slide (sheet) at 320ms ease-out.
- **Live dot:** 2s pulse only on (re)connect, never continuous.
- **`prefers-reduced-motion: reduce`:** disable translate, scale, roll, and typing. Use instant state changes or opacity-only fades ≤120ms. The terminal shows its final state.

---

## 10. Accessibility

- WCAG 2.2 AA. Text contrast ≥ 4.5:1 (all tokens in §4.1 pass on surfaces) and UI component boundaries ≥ 3:1. Inputs therefore use `--border-strong` `#3A3A4E` on surface-2, and must be verified with focus states.
- Keyboard: every action is reachable, with a visible focus ring (accent 2px + offset). Tab order follows visual order. ⌘K / Ctrl+K opens the command menu. Esc closes sheets. Dialog focus is trapped and returns to the trigger.
- The kill switch AlertDialog autofocuses **Cancel**. The destructive button has a full label ("Sign and stop spending").
- Color is never the only signal: privacy chips carry an icon + text, amounts carry +/−, and status dots carry text.
- Live regions: `aria-live="polite"` for the sync status and new activity count. Use `role="alert"` for errors (existing pattern) and limit denials.
- Masked balances use `aria-label="Balance hidden"`. Truncated addresses carry the full address in `aria-label` and a tooltip.
- Touch targets ≥ 44×44 on mobile. Bottom tab bar respects `env(safe-area-inset-bottom)`.
- Forms: label every input (no placeholder-only labels), tie errors to `aria-describedby`, use `inputMode="decimal"` for amounts and `autocomplete="off"` + `spellCheck={false}` for addresses and tokens.
- Respect reduced motion (§9). Respect 200% zoom without horizontal scroll at 360px (wrap mono strings with `overflow-wrap:anywhere`).
- `lang="en"`, a meaningful `<title>` per route ("Policy · Ringside"), and landmarks (`header`, `nav`, `main`, `footer`).

---

## 11. Do / Don't

**Do**
- Make the private balance the largest thing on the screen.
- Pair every privacy claim with its limit ("amount and asset hidden; sender and recipient public").
- Use the accent once per view for the primary action.
- Show real tool names, real error codes, and real commands in mono.
- Give every signature a review step with before → after.
- Teach in empty states, with a command or button.
- Keep `DEVNET BETA` visible on every screen.
- Label swap and escrow `PREVIEW` and say why.
- Use tabular numerals and units on every amount.

**Don't**
- Don't use green surfaces, green borders, or green-on-green. Green is for small success signals only.
- Don't put the pairing form above the balance after first run.
- Don't use `window.confirm` / `alert`.
- Don't show raw JSON as the main policy UI.
- Don't say "anonymous", "untraceable", "fully private", or "invisible", and don't imply deposits or withdrawals are private.
- Don't claim mainnet, production readiness, USDC support, or working swap/escrow. Don't claim devnet private transfers are verified (they're blocked upstream; localnet is verified).
- Don't animate continuously (no looping glows, pulsing CTAs, or marquee logos).
- Don't use all-caps labels except badges, and don't use more than one serif-italic word group per headline.
- Don't add a second accent color. Private cyan is a semantic marker, not a brand color.
- Don't display full addresses or tokens inline. Never log or echo the pairing token.

---

## 12. Implementation checklist with acceptance criteria

**P0 = must ship before the Oct 12 PT deadline.**

| # | Task | Pri | Acceptance criteria |
|---|---|---|---|
| 1 | Tailwind v4 + shadcn init in `apps/dashboard`; tokens from §4 in `globals.css`; Geist + Instrument Serif via `next/font` | P0 | `pnpm --filter ringside-dashboard build` passes; no `#09120f`/`#b7f497`/`#112019` remain (`rg` returns 0); body renders in Geist |
| 2 | Extract `lib/control-client.ts` + `useRingside()` | P0 | Same endpoints and envelope bytes as before; kill-switch toggle against the localnet control API still verifies (no 403); SSE + 5s fallback still refresh within 5s |
| 3 | `AppShell` with sidebar / bottom tabs, top bar, `DevnetBanner`, `NetworkBadge`, `AgentStatusPill`, `WalletButton` | P0 | At 360px: no horizontal scroll, bottom tabs visible, DEVNET BETA visible. At 1280px: sidebar visible. Localnet shows LOCALNET |
| 4 | `PrivateBalanceCard` as hero, with mask toggle, public-SOL sub-row, Deposit/Withdraw | P0 | Largest element above the fold at 360 and 1280; amounts `tabular-nums`; "Amount hidden on-chain" chip present; mask persists on reload |
| 5 | Onboarding stepper replaces the top pairing card; Connection drawer | P0 | With empty localStorage, the stepper shows and no dashboard cards; once paired, the stepper never shows again and the pairing UI is only reachable via the status pill / drawer; 401 and network errors show the specified copy |
| 6 | Kill switch button + AlertDialog + global KillStrip | P0 | One click never signs (dialog first, Cancel focused); after signing, strip appears within 5s; Resume needs a confirm; disabled with tooltip for non-owner |
| 7 | `SpendControlsCard` + `LimitMeter` | P0 | Shows spent/max and remaining; color changes at 80% and 100%; null budget shows the empty copy |
| 8 | Activity rows/table + detail sheet + privacy chips | P0 | Transfers show "Private · amount hidden"; deposits and withdrawals show "Public"; explorer link correct for devnet and localnet; new SSE item animates in |
| 9 | Policy form (all schema fields) + diff review + sign | P0 | Every field in `policy.ts` is editable without JSON; diff lists only changed fields; signed save bumps `policy_version`; JSON tab round-trips; unknown fields are preserved |
| 10 | `MoveFundsSheet` replacing `window.confirm` | P0 | Public notice visible in both modes; amount validation as today; summary before sign; success shows signature link |
| 11 | Empty/loading/error states per §7.11 + `lib/errors.ts` | P0 | Each listed empty state renders with its action; skeletons match final layout (no CLS > 0.05); every listed error code maps to its copy |
| 12 | Landing page sections §6.1–6.12 at `/` (dashboard at `/app`, `/audit` redirects) | P0 | All sections present; hero honesty line present; privacy table matches §6.7 exactly; Preview label on swap/escrow; Lighthouse performance ≥ 90 and a11y ≥ 95 on mobile |
| 13 | Auditor view restyled (`/app/audit`) | P1 | No write controls rendered; VIEW ONLY badge; separate token key |
| 14 | Motion per §9 + reduced-motion | P1 | With `prefers-reduced-motion`, no transforms or typing; no infinite animations anywhere (`rg "infinite"` only in skeleton shimmer) |
| 15 | ⌘K command menu | P2 | Opens with Cmd/Ctrl+K; includes Stop spending (routes to the same dialog) |
| 16 | Accessibility pass | P0 | axe: 0 serious/critical; full keyboard run-through of pair → stop spending → resume → policy edit → deposit |
| 17 | Copy pass | P0 | `rg -i "anonymous\|untraceable\|fully private\|invisible\|mainnet-ready"` returns 0 in UI strings; sentence case everywhere except badges |
| 18 | Screenshots for README/submission | P1 | Replace `docs/dashboard.png` and `docs/dashboard-live.png` with the new UI at 1280 and 390 widths |

---

## 13. Sources and provenance

- Mercury: https://mercury.com, https://mercury.com/security, https://mercury.com/treasury, and the CSS bundles `/_next/static/chunks/{0ymh8_-1p5c0z,27pvdfny9go53,2zzge696ke5zk,3rm7al58430ok}.css` (fetched Oct 9 2026; token values in §1.1 copied from them).
- Linear: https://linear.app and the CSS from `static.linear.app/web/_next/static/css/*`.
- Squads: https://squads.so (Framer HTML; Inter + Pixelify Sans, near-black rgb(16,16,18)).
- Ramp: https://ramp.com/expense-management.
- Vercel Geist: https://vercel.com/geist/introduction, `/geist/colors.md`, `/geist/materials.md`.
- Ringside repo (public, `main` as of Oct 9): `apps/dashboard/app/{page,audit/page,globals.css,layout}.tsx`, `packages/mcp/src/{policy,control,cli,index,engine-tools}.ts`, `examples/seller-api/index.mjs`, `README.md`, `docs/security.md`, `STATUS.md`.
- **mayor-skills (private): not accessed.** Both GitHub paths failed. The `user-GitHub-xai` connector is authenticated as `mayorXBT` but returns 404 for `mayorXBT/mayor-skills`, and it isn't among the account's searchable repos (the token likely lacks private-repo scope, or the repo name differs). `gh` on the box is not logged in, and the `cursor-github` connector reports "GitHub is not connected." **No rule in this document is attributed to a mayor-skills skill.** When access is granted, fold the relevant `.agents/skills/*/SKILL.md` rules into §2, §3, §4, §9 and §11, citing folder names, and resolve any conflicts in favor of the skills.
