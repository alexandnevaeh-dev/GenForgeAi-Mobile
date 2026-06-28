# GenForgeAI — Complete UI Layout Document

---

## 1. Technology & Rendering Environment

- **Framework:** Expo / React Native with `expo-router` (file-based routing)
- **Navigation library:** Expo Router Stack + Tabs
- **Icons:** `@expo/vector-icons` Feather (cross-platform) + `expo-symbols` SF Symbols (iOS only)
- **Tab bar variant:** On iOS devices with Liquid Glass capability → `NativeTabs` (unstable API); everywhere else → `expo-blur` BlurView + classic `Tabs`
- **Fonts:** Inter 400, 500, 600, 700 (loaded via `@expo-google-fonts/inter`)
- **Global providers (outermost → innermost):** `SafeAreaProvider` → `ErrorBoundary` → `QueryClientProvider` → `AuthProvider` → `ProjectsProvider` → `NotificationsProvider` → `ChatProvider` → `GestureHandlerRootView` → `KeyboardProvider`

---

## 2. Design System

### Color Tokens

| Token | Dark | Light |
|---|---|---|
| `background` | `#0A0A0F` | `#f5f5ff` |
| `card` | `#12121A` | `#ffffff` |
| `foreground` | `#F0F0F8` | `#0a0a0f` |
| `primary` | `#2B7FFF` (blue) | `#2B7FFF` |
| `secondary` | `#7B2FFF` (purple) | `#7B2FFF` |
| `accent` | `#00D4FF` (cyan) | `#00D4FF` |
| `muted` | `#1E1E2E` | `#e8e8f0` |
| `mutedForeground` | `#6B6B80` | `#6b6b80` |
| `border` / `input` | `#1E1E2E` | `#d0d0e0` |
| `success` | `#22C55E` | `#22C55E` |
| `warning` | `#F97316` | `#F97316` |
| `destructive` | `#EF4444` | `#EF4444` |

### Typography

All text uses the Inter family. Section labels use `letterSpacing: 1–1.2` and `fontSize: 10–11` in all-caps. Body text is `13–15px`. Headlines are `17–28px Inter_700Bold`.

### Spacing & Shape

- Default border radius: **14** (cards), 10–12 (inputs/chips), 20 (pill chips)
- Gap rhythm: `gap: 8`, `gap: 12`, `gap: 16`, `gap: 20`
- Cards use `borderWidth: 1` with the `border` token

---

## 3. Root Navigation Stack

`app/_layout.tsx` defines a `Stack` navigator with `headerShown: false` globally and `animation: "slide_from_right"` as default.

| Stack Screen | Presentation | How to reach it |
|---|---|---|
| `(tabs)` | Default (push) | App launch / auth success |
| `new-game` | **Modal** (sheet) | Home quick actions, Projects header button |
| `project/[id]` | Default (push) | ProjectCard tap, completing New Game wizard |
| `marketplace` | Default (push) | Home "Browse all", Drawer "Marketplace" |
| `community` | Default (push) | Home "Community Highlights", Drawer |
| `export-center` | Default (push) | Home quick action, Drawer "Export Center" |
| `auth/login` | **Modal** (slide from bottom) | Profile "Sign In", Register "Sign In" link |
| `auth/register` | **Modal** (slide from bottom) | Profile "Create Account", Login "Create account" link |

---

## 4. Bottom Tab Bar

Six tabs, always visible. Tab bar is positioned `absolute` over content with bottom insets. On iOS: frosted glass `BlurView` background. On Android/web: solid `colors.background`.

| # | Route | Label | iOS Icon (SF Symbol) | Android/Web Icon (Feather) |
|---|---|---|---|---|
| 1 | `(tabs)/index` | **Home** | `house` / `house.fill` | `home` |
| 2 | `(tabs)/chat` | **AI Chat** | `bubble.left` / `bubble.left.fill` | `message-square` |
| 3 | `(tabs)/projects` | **Projects** | `folder` / `folder.fill` | `folder` |
| 4 | `(tabs)/assets` | **Assets** | `photo.on.rectangle` / `photo.fill.on.rectangle.fill` | `image` |
| 5 | `(tabs)/jobs` | **Jobs** | `gearshape.2` / `gearshape.2.fill` | `cpu` |
| 6 | `(tabs)/profile` | **Profile** | `person.circle` / `person.circle.fill` | `user` |

Active tint: `colors.primary` (`#2B7FFF`). Inactive tint: `colors.mutedForeground`.

---

## 5. Tab Screens

---

### 5.1 Home (`app/(tabs)/index.tsx`)

**Purpose:** Dashboard and launch pad for all primary actions.

**Layout (top to bottom, scrollable):**

1. **Header row** — Menu button (☰, 42×42 rounded square, opens Drawer) · `GenForgeAI` logotype (28px bold, "AI" in primary blue) · Bell button (42×42 circle, opens NotificationPanel). Bell shows a blue numeric badge when `unreadCount > 0`.

2. **Active Project Banner** *(conditional — shown when a project has status `in_progress` or `generating`)* — Card with a primary-blue border. Contains: "GENERATING" pill chip with live dot · project title · thin progress bar (4px, primary fill) · percentage + "View details →". Tapping navigates to `project/[id]`.

3. **QUICK ACTIONS** (section label) — Horizontal scroll row of `QuickAction` chips:
   - Create Game → `/new-game`
   - AI Studio → `/(tabs)/chat`
   - Projects → `/(tabs)/projects`
   - Assets → `/(tabs)/assets`
   - Marketplace → `/marketplace`
   - Export → `/export-center`

4. **AI Activity card** — Card with CPU icon + "AI Activity" title + green "23 agents active" indicator. Three bullet rows showing agent completion messages.

5. **TRENDING TEMPLATES** (section label + "Browse all" link → `/marketplace`) — Horizontal scroll of 130px template cards. Each card: icon placeholder · title (2 lines) · genre + price/FREE badge.

6. **RECENT PROJECTS** (section label + "See all" link) — Shows last 3 projects as `ProjectCard` components. Skeleton placeholder while loading; dashed empty state if none.

7. **Community Highlights card** — Card with users icon, title, and a text blurb. "View all" link → `/community`.

8. **Tip row** — Muted background pill with a zap icon and a prompt-writing hint.

**Modals rendered:** `Drawer`, `NotificationPanel`

---

### 5.2 AI Studio / Chat (`app/(tabs)/chat.tsx`)

**Purpose:** Persistent conversational interface with the "Master Game Director" AI.

**Layout:**

1. **Header** — Left: 36px blue circle avatar (CPU icon) + "AI Studio" title + "Master Game Director · Online" subtitle in green. Right: Activity toggle button (toggles Task Timeline) + Clear/refresh button.

2. **Task Timeline** *(collapsible, shown when activity toggle is on)* — Card with "AI TASK PROGRESS" label. Vertical list of 6 steps with dots (green=done, blue=active, gray=pending) and connector lines.

3. **Message List** (`FlatList`, inverted for newest-at-bottom) — Each message rendered by `ChatBubble`. When only the greeting message is visible, shows:
   - "Start with a prompt..." label
   - 4 suggestion chips (e.g. "Dark fantasy RPG with procedural dungeons") — tap to fill input

4. **Input Bar** (pinned to bottom, keyboard-avoiding):
   - Toolbar row: Mic button · Paperclip button · Image button · "23 agents ready" label
   - Input area: multiline `TextInput` ("Describe your game...", max 500 chars) + Send button (blue when has text, gray when empty/busy; shows loader icon while typing)

---

### 5.3 Projects (`app/(tabs)/projects.tsx`)

**Purpose:** Full library of the user's game projects.

**Layout (scrollable):**

1. **Header row** — "Projects" title (28px bold) · View mode toggle (List/Grid segmented control) · Blue circular "+" button → `/new-game`

2. **Search bar** — Card-background input with search icon and an ×-clear button when text is present.

3. **Filter chips** (horizontal scroll, pill style):
   - All · In Progress · Complete · Planning

4. **Stats row** — Three equal cards: Total / Active / Done counts.

5. **Project list or grid:**
   - **List mode:** `ProjectCard` components (animated press scale 0.97×)
   - **Grid mode:** 2-column `GridCard` layout. Each grid card: 90px colored thumbnail placeholder (layers icon, live blue dot if active) + title + genre & art style + optional mini progress bar + status dot + capitalized status text.
   - Loading: 3 skeleton rectangles (120px tall, rounded).
   - Empty: dashed border card with folder icon + contextual message.

---

### 5.4 Assets (`app/(tabs)/assets.tsx`)

**Purpose:** Universal image asset library — browse, generate, slice, and export game art.

**Layout (scrollable + modals):**

1. **"Assets" title** (28px bold)

2. **Stats chips** *(horizontal scroll, shown when assets exist)* — One chip per non-empty category (Cover, Character, Boss, Environment) showing count + colored dot.

3. **Category filter chips** (horizontal scroll, pill style with icon):
   - All · Cover Art · Characters · Bosses · Worlds

4. **Asset grid** — 2-column wrap. Each `AssetCard`:
   - Square thumbnail (1:1 aspect) — actual image if loaded, colored icon placeholder if not.
   - Red heart badge (top-right) if favorited.
   - Below: category chip (tiny all-caps colored label) · asset name (2 lines) · time-ago string.
   - Tap → opens Lightbox modal.

5. **Floating Action Button** (blue "+" circle, bottom-right, only for authenticated users) → opens `AssetCreatorModal`.

6. **Guest / error / empty states** — Centered card with lock/alert/image icon + title + body text.

**Modals on this screen:**

#### Asset Lightbox (full-screen overlay, fade animation)
- Background: `#000000EE`
- Header: × close · asset name + "CATEGORY · time-ago" · heart toggle (red when favorited)
- Image: full-width `Image` (screen width − 32, square) centered
- Tags: translucent white pill chips
- Action buttons (flex row, up to 3):
  - **Regenerate** (blue) — shown for cover/character/boss/environment categories
  - **Frames** (purple `#7B2FFF`) — shown for any asset with a non-data: URL; closes lightbox and opens SpriteSheetToolsModal
  - **Delete** (red outline) — confirmation Alert before deletion

#### Asset Creator Modal (`AssetCreatorModal.tsx`, full pageSheet)
- 14 asset categories: sprite, spritesheet, portrait, background, environment, cover, splash, tileset, texture, icon, ui, item, vfx, concept
- 16 art styles: Pixel Art, Anime, Fantasy, Sci-Fi, Cartoon, Realistic, Hand-painted, Cyberpunk, Isometric, Chibi, Low Poly, Retro, Voxel, Steampunk, Horror, Stylized 3D
- Text prompt with category-specific placeholder hint
- Fast/High quality toggle
- Generates via `POST /api/assets/generate`
- Shows live preview once complete

#### Sprite Sheet Tools Modal (`SpriteSheetToolsModal.tsx`, pageSheet)
Opened from the Lightbox "Frames" button. Four sections:

- **Grid** — Rows stepper (1–16) · Columns stepper (1–16) · Margin stepper (0–512) · Spacing stepper (0–512). Frame count hint (red if >144). "Slice into frames" primary button (scissors icon, disabled if >144 frames or no image).
- **Animation** *(shown after a slice)* — 1:1 stage displaying the current frame + frame counter badge. Play/Pause button + FPS stepper (1–30). Frames cycle automatically at the given rate.
- **Frames** *(shown after a slice)* — Wrap grid of frame thumbnails, up to 6 per visual row. Tapping a frame pauses and jumps to it. Active frame has a blue border.
- **Export** *(shown after a slice)* — Description text + "Export for game engine" button (purple). On native: downloads via `expo-file-system/legacy` with auth header → `expo-sharing` share sheet. On web: blob + anchor download. Shows confirmation note or error inline.

---

### 5.5 Jobs (`app/(tabs)/jobs.tsx`)

**Purpose:** Real-time monitor for background AI generation tasks.

**Layout (scrollable with pull-to-refresh):**

1. **Header row** — "Jobs" title + active badge pill (blue, animated dot + "N active") when jobs are running.

2. **Stats chips** *(shown when jobs exist)* — Running (blue) · Queued (orange) · Done (green) · Failed (red). Count + label per chip.

3. **Filter chips** (horizontal scroll): All · Running · Queued · Done · Failed

4. **Job list** — `JobStatusCard` components with a timestamp sub-label ("Started Xm ago · project linked"). Auto-polls every 4 seconds while any job is active.

5. **States:**
   - Loading: `ActivityIndicator`
   - Guest: lock icon card ("Sign in to see your jobs")
   - Error: alert icon card
   - Empty: CPU icon card + contextual message

**Cancel action:** Alert with "Keep Running" / "Cancel Job" (destructive) options. Sends `DELETE /api/jobs/:id`.

---

### 5.6 Profile (`app/(tabs)/profile.tsx`)

**Purpose:** Account management, subscription, security settings, and AI generation preferences.

**Layout (scrollable):**

1. **Profile Card** — Avatar circle (initials, primary blue; camera badge for future photo editing) · display name · `@username · email` · tier badge (colored border+fill based on Free/Pro/Studio/Enterprise/Guest). Guest users see a "Create Free Account" button → `/auth/register`.

2. **Stats grid** — 4 equal boxes: Projects · Completed · AI Runs · Assets (data from live API + local context).

3. **AI Credits card** — Zap icon + "AI Credits" + used/limit display. Progress bar (blue if <80%, orange if ≥80%). "N credits remaining · Resets monthly" or "Unlimited credits".

4. **Profile tab bar** — Three segmented tabs (icon + label): Account · Subscription · Security.

**Account tab:**
- PROFILE group: Edit Profile (opens inline modal) · Username · Email (with "Verified" badge) · Cloud Storage · Connected Accounts
- CONNECTED ACCOUNTS group: Google · GitHub · Apple · Discord · Microsoft (first two shown as "Linked" in green; rest "Connect" in blue)
- AI SETTINGS group: AI Model · Generation Quality · Export Engines · Dark Mode toggle
- NOTIFICATION PREFERENCES group: Job Completion Alerts / Email Notifications / Build Completion Alerts — all `Switch` toggles
- GENERATION DEFAULTS: Genre chip picker (10 genres) + Art Style chip picker (7 styles) — selection saved to API
- Footer group: Help & Support · Send Feedback · Sign Out (destructive) or Sign In link

**Subscription tab:** Current plan card (colored border), plan features, upgrade options for other tiers.

**Security tab:** MFA toggle, session management, password change.

**Edit Profile Modal** (transparent overlay, slide-up sheet):
- Handle bar · "Edit Profile" title
- Display Name `TextInput` (max 64 chars)
- Bio `TextInput` multiline (max 280 chars)
- Error text if validation fails
- Cancel (muted) / Save (primary blue, ActivityIndicator while saving) buttons

---

## 6. Full-Screen Stack Screens

---

### 6.1 Sign In (`app/auth/login.tsx`, modal slide from bottom)

**Layout (scrollable, keyboard-avoiding):**

1. **Brand** — 64px blue rounded-square icon (CPU) · "GenForgeAI" logotype · "AI-Powered Game Development Studio" tagline
2. **OAuth buttons** (5) — Google · Apple · GitHub · Discord · Microsoft. Currently show an inline message directing to email/password.
3. **Divider** — "or sign in with email"
4. **Email/Password form** — Error box (destructive red) if any. Email field (mail icon) · Password field (lock icon + eye toggle). "Forgot password?" link (right-aligned).
5. **Sign In button** — Full-width primary blue, ActivityIndicator while loading.
6. **Security note** — "Secured with TLS · JWT auth · MFA available"
7. **Footer** — "Don't have an account? Create account" → `/auth/register`
8. **Guest link** — "Continue as Guest (10 free AI credits)"

---

### 6.2 Create Account (`app/auth/register.tsx`, modal slide from bottom)

**Two-step flow:**

**Step 1 — Choose Your Plan:**
- Subtitle: "Start free, upgrade anytime. No credit card required."
- Three tier cards (Free / Pro / Studio) — each with label, price, AI credits/mo, project limit. "POPULAR" badge on Pro. Selected card gets a 2px primary border + blue checkmark.
- "Continue with [Plan]" button → advances to Step 2
- "Continue as Guest" link

**Step 2 — Create Account:**
- Plan badge (selected plan + price)
- Form fields: Display Name · Username · Email · Password (with eye toggle)
- Password strength bar (4 segments, green when strong, orange when medium, based on length)
- "Create Account" button (primary blue)
- Terms of Service / Privacy Policy links
- "Already have an account? Sign In" link → `/auth/login`

---

### 6.3 New Game Wizard (`app/new-game.tsx`, modal sheet)

6-step flow: Mode selection → Prompting → Genre → Art Style → Analysis → Generation view. On completion, navigates to `project/[id]`.

---

### 6.4 Project Detail (`app/project/[id].tsx`)

Horizontal inner tab bar with 11 tabs:

| Tab | Component | Description |
|---|---|---|
| Overview | `BlueprintPanel` | Design pillars, vision statement, milestones |
| Chat | `ProjectChatPanel` | Project-scoped AI chat |
| Blueprint | `BlueprintPanel` | Source of truth document |
| Tasks | `TaskGraph` | Dependency-linked pipeline task list |
| Systems | `ProceduralSystemsPanel`, `BalanceTunerPanel`, `GenLogicPanel` | Gameplay systems |
| Assets | `AssetGenerationPanel`, `ImageGenPanel` | Asset generation within project |
| Export | `DownloadExportPanel`, `ExportFrameworkPanel`, `ExportValidationPanel` | Export pipeline |
| Quality | `QADashboard`, `PlaytestPanel`, `QualityGates` | Testing and QA |
| Agents | `AgentNetwork`, `OrchestratorDashboard`, `ModelRouterPanel` | AI agent visualization |
| Memory | `ProjectMemoryPanel` | Project knowledge store |
| Publish | `PublishingHub`, `MonetizationPanel`, `StoreListingPanel`, `LiveOpsPanel` | Publishing and monetization |

Also uses: `GenerationConsole` (real-time log), `AnalyticsDashboard`, `TelemetryPanel`.

---

### 6.5 Marketplace (`app/marketplace.tsx`)

Featured banner, category filters (Templates / Agents / Plugins), search input, `TemplateDetailModal`. Tapping "Use template" navigates to `project/[id]`.

---

### 6.6 Community (`app/community.tsx`)

Four sections — Feed (PostCards) · Showcase (ranked games) · Challenges · Tutorials. Compose modal for new posts. Links to author profiles and project detail views.

---

### 6.7 Export Center (`app/export-center.tsx`)

Project export status dashboard. `TargetSelector` for engine choice (Godot, Unity, Unreal, etc.). Download triggers. Links back to `project/[id]`.

---

## 7. Overlays & Drawers

---

### 7.1 Drawer (`components/Drawer.tsx`)

280px left side-panel, `Modal` with animated spring entry (tension 65, friction 11) and 55% black backdrop fade.

**Contents:**
- Brand: 36px icon + "GenForgeAI" + "v1.0 · Pro"
- Divider
- **WORKSPACE** group: Dashboard · AI Studio · Projects · Assets
- Divider
- **DISCOVER** group: Marketplace · Community · Templates · Notifications (badge: 3) · Cloud Sync · Export Center · Analytics · Help Center · Settings · Feedback
- Divider
- Footer: "850 AI Credits" chip (zap icon + cyan accent)

All items: 30px icon box + label. Notification item shows a blue count badge.

---

### 7.2 Notification Panel (`components/NotificationPanel.tsx`)

Opened by the bell button on the Home header. Renders unread notification items from `NotificationsContext`.

---

## 8. Reusable Components Summary

| Component | Purpose | Key UI Elements |
|---|---|---|
| `ProjectCard` | Clickable project summary | Status dot + title + description (2 lines) + genre/art-style tags + progress bar (when active). Press animates to 0.97× scale. |
| `JobStatusCard` | Background job tracker | Phase-by-phase progress, status chip, cancel button, real-time polling. |
| `ChatBubble` / `ChatMessage` | Single chat message | User vs AI bubble styling with message text. |
| `QuickAction` | Home action chip | Feather icon + label; accent variant gets primary blue background. |
| `AgentNetwork` | Visual agent graph | Parallel AI agent execution visualization (Foundational, World, Content agents, etc.). |
| `BlueprintPanel` | Source-of-truth viewer | Design pillars, vision statement, milestones. |
| `TaskGraph` | Pipeline task list | Dependency-linked pipeline tasks. |
| `GenerationConsole` | Live log display | Real-time generation status + scrolling log lines. |
| `AIProgressIndicator` | Generation progress | Animated indicator for AI tasks. |
| `ImageGenPanel` | Image generation panel | Used within project detail asset tab. |
| `OrchestratorDashboard` | Agent orchestration | Master coordination view for AI pipeline. |
| `ModelRouterPanel` | AI model routing | Model selection and routing configuration. |
| `AnalyticsDashboard` | Project analytics | Charts and metrics for project progress. |
| `TelemetryPanel` | Telemetry data | Runtime telemetry from generation processes. |
| `MonetizationPanel` | Monetization config | IAP and store monetization settings. |
| `StoreListingPanel` | Store listing | App store listing metadata editor. |
| `LiveOpsPanel` | Live operations | Post-launch live ops configuration. |
| `ProceduralSystemsPanel` | Procedural gen | Procedural world/content generation settings. |
| `BalanceTunerPanel` | Game balance | Numeric balance tuning for game systems. |
| `GenLogicPanel` | Generation logic | AI generation logic configuration. |
| `PlaytestPanel` | Playtesting | Playtest session management. |
| `QADashboard` | QA overview | Test results and quality metrics. |
| `QualityGates` | Quality gates | Pass/fail criteria for export readiness. |
| `PublishingHub` | Publishing | End-to-end publishing pipeline. |
| `ErrorBoundary` / `ErrorFallback` | Crash safety | Catches render errors, shows fallback UI. |
| `KeyboardAwareScrollViewCompat` | Keyboard handling | Cross-platform keyboard avoidance wrapper. |

---

## 9. Context Providers

| Context | File | Data / Actions |
|---|---|---|
| `AuthContext` | `context/AuthContext.tsx` | `user`, `accessToken`, `isAuthenticated`, `login`, `logout`, `register`, `continueAsGuest`, `patchUser` |
| `ProjectsContext` | `context/ProjectsContext.tsx` | `projects`, `isLoading` — project list fetched and cached globally |
| `NotificationsContext` | `context/NotificationsContext.tsx` | `unreadCount`, notification items |
| `ChatContext` | `context/ChatContext.tsx` | `messages`, `isTyping`, `sendMessage`, `clearChat` |

---

## 10. Navigation Flow Summary

```
App Launch
  └─ auth/login (modal, slide-up)
       └─ auth/register (modal, slide-up)
            └─ (tabs) [Home]
  └─ (tabs) [Guest or authenticated]
       ├─ Home
       │    ├─ Drawer (left side panel, 280px spring animation)
       │    ├─ NotificationPanel (right overlay)
       │    ├─ Active Project Banner → project/[id]
       │    ├─ Quick Actions → new-game / chat / projects / assets / marketplace / export-center
       │    └─ Community Highlights → community
       ├─ AI Chat
       │    └─ TaskTimeline (collapsible inline panel)
       ├─ Projects
       │    ├─ new-game (modal)
       │    └─ project/[id] (push)
       │         └─ 11-tab inner bar (Overview / Chat / Blueprint /
       │            Tasks / Systems / Assets / Export / Quality /
       │            Agents / Memory / Publish)
       ├─ Assets
       │    ├─ Lightbox modal (full-screen overlay, fade)
       │    │    ├─ Regenerate (in-place API call)
       │    │    ├─ Frames → SpriteSheetToolsModal (pageSheet)
       │    │    │    ├─ Slice (POST /assets/:id/slice)
       │    │    │    ├─ Frame grid + animation preview
       │    │    │    └─ Export (GET /assets/:id/export → zip share)
       │    │    └─ Delete (Alert confirmation)
       │    └─ AssetCreatorModal (pageSheet)
       │         └─ 14 categories · 16 styles · prompt · quality
       ├─ Jobs
       │    └─ Cancel (Alert confirmation → DELETE /api/jobs/:id)
       └─ Profile
            ├─ Edit Profile (inline bottom sheet)
            ├─ auth/login (modal)
            ├─ auth/register (modal)
            └─ Sign Out (Alert confirmation)
```

---

*Generated from source on 2026-06-28. All layout details reflect the live codebase.*
