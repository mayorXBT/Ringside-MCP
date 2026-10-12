# SwiftPieces component audit

Checked 12 October 2026 against [SwiftPieces components](https://swiftpieces.com/components), its 16 category pages, 69 component docs, [installation](https://swiftpieces.com/docs/installation), and [CLI](https://swiftpieces.com/docs/cli).

## Compatibility decision

SwiftPieces is a **SwiftUI/iOS library**, not a shadcn React registry. Every free component below is documented as an iOS 17+ Swift source file. The documented `npx swiftpieces add <Name>` command requires an `.xcodeproj` and writes Swift files under the app’s `SwiftPieces/` directory. The alternative is copying Swift code into an Xcode target. Neither installs into Ringside’s Next.js/React app. No audited component calls for Framer Motion or Tailwind (v3 or v4); these dependencies are not applicable. The library also offers Pro screens/flows/templates, which require a license; none are selected below. **Do not run the CLI in this repo or translate these into lookalike React components under the guise of an upstream install.**

## Eight SwiftUI visual references

These were the visual references. No SwiftUI code was installed in the web app. Each links to its original iOS documentation and install command.

| Component | Exact Ringside spot | Documented install | React feasibility |
|---|---|---|---|
| [TextReveal](https://swiftpieces.com/docs/components/text/text-reveal) | Landing hero headline: a one-time restrained reveal; omit the source glass-stroke effect. | `npx swiftpieces add TextReveal` in an Xcode project, or copy Swift source | Incompatible with Next.js |
| [StatusTimeline](https://swiftpieces.com/docs/components/lists/status-timeline) | Landing “How it works” steps: active/completed state without the breathing loop. | `npx swiftpieces add StatusTimeline` in an Xcode project, or copy Swift source | Incompatible with Next.js |
| [LiveStat](https://swiftpieces.com/docs/components/data/live-stat) | Landing stat pill: animate numbers once; omit the scrub chart and glass. | `npx swiftpieces add LiveStat` in an Xcode project, or copy Swift source | Incompatible with Next.js |
| [SkeletonLoader](https://swiftpieces.com/docs/components/feedback/skeleton-loader) | /app balance and activity loading state: a quiet placeholder with reduced-motion support. | `npx swiftpieces add SkeletonLoader` in an Xcode project, or copy Swift source | Incompatible with Next.js |
| [AmountField](https://swiftpieces.com/docs/components/inputs/amount-field) | /app Withdraw dialog: numeric amount entry and locale-aware formatting. | `npx swiftpieces add AmountField` in an Xcode project, or copy Swift source | Incompatible with Next.js |
| [StatusMorph](https://swiftpieces.com/docs/components/feedback/status-morph) | /app payment status: pending, confirmed, or failed state; no perpetual spin. | `npx swiftpieces add StatusMorph` in an Xcode project, or copy Swift source | Incompatible with Next.js |
| [Toast](https://swiftpieces.com/docs/components/sheets/toast) | /app transaction feedback: brief success/error message; no glass or countdown ring. | `npx swiftpieces add Toast` in an Xcode project, or copy Swift source | Incompatible with Next.js |
| [CommitButton](https://swiftpieces.com/docs/components/controls/commit-button) | /app owner-signed policy save: idle, signing, success, error states. | `npx swiftpieces add CommitButton` in an Xcode project, or copy Swift source | Incompatible with Next.js |

## React registry implementation map

The web equivalents below were installed with the linked shadcn registry commands. Their generated files were adjusted to Ringside tokens and short, reduced-motion-safe transitions; there is no SwiftUI source in the app.

| SwiftPieces reference | Web equivalent and source | Ringside spot | Registry command |
|---|---|---|---|
| TextReveal | [Magic UI Text Animate](https://magicui.design/docs/components/text-animate) | Landing hero headline, one word fade | `pnpm dlx shadcn@latest add -y @magicui/text-animate` |
| StatusTimeline | [Magic UI Animated List](https://magicui.design/docs/components/animated-list) | Landing How it works steps | `pnpm dlx shadcn@latest add -y @magicui/animated-list` |
| LiveStat | [Magic UI Number Ticker](https://magicui.design/docs/components/number-ticker) | Landing stat pill | `pnpm dlx shadcn@latest add -y @magicui/number-ticker` |
| SkeletonLoader | [shadcn Skeleton](https://ui.shadcn.com/docs/components/radix/skeleton) | /app agent loading state | `pnpm dlx shadcn@latest add -y skeleton` (already present) |
| AmountField | [shadcn Input](https://ui.shadcn.com/docs/components/radix/input) | /app Withdraw amount with SOL suffix | `pnpm dlx shadcn@latest add -y input` (already present) |
| StatusMorph | [Magic UI Animated Circular Progress Bar](https://magicui.design/docs/components/animated-circular-progress-bar) | /app allowed/stopped status indicator | `pnpm dlx shadcn@latest add -y @magicui/animated-circular-progress-bar` |
| Toast | [shadcn Sonner](https://ui.shadcn.com/docs/components/radix/sonner) | /app action feedback | `pnpm dlx shadcn@latest add -y sonner` |
| CommitButton | [Magic UI Shimmer Button](https://magicui.design/docs/components/shimmer-button) | /app Save signed policy button | `pnpm dlx shadcn@latest add -y @magicui/shimmer-button` |

## Full free component catalog

All catalog rows use the documented Xcode install pattern `npx swiftpieces add <Name>` (or copy the page’s Swift source). Dependencies for **every** row: SwiftUI, iOS 17+; Framer Motion: none; Tailwind: none. Each page may have extra Apple frameworks or capabilities; review its page before an iOS install. Descriptions below summarize the component’s documented behavior.

### Ai — 6

| Component and docs | What it does | Install |
|---|---|---|
| [AssistantOrb](https://swiftpieces.com/docs/components/ai/assistant-orb) | A dark glass ball with a Siri-style voice wave inside, locked to the thinking state; four thin sine membranes travel through the equator of a refracting shell, drawn by a Metal… | `npx swiftpieces add AssistantOrb` |
| [PromptChips](https://swiftpieces.com/docs/components/ai/prompt-chips) | Liquid glass prompt chips above a composer, in a snapping horizontal row or a grid of columns, each keyed by a tinted glyph disc | `npx swiftpieces add PromptChips` |
| [SourceStack](https://swiftpieces.com/docs/components/ai/source-stack) | Citations for an AI answer: a compact pill of overlapping site badges and a source count that opens into a list of numbered source cards | `npx swiftpieces add SourceStack` |
| [StreamingReply](https://swiftpieces.com/docs/components/ai/streaming-reply) | The AI reply surface in liquid glass | `npx swiftpieces add StreamingReply` |
| [ThinkingState](https://swiftpieces.com/docs/components/ai/thinking-state) | The "assistant is working" placeholder, laid out like the reply it becomes: a liquid glass header pill carrying a breathing mark and an elapsed-seconds label that morphs as it… | `npx swiftpieces add ThinkingState` |
| [ThoughtOrb](https://swiftpieces.com/docs/components/ai/thought-orb) | A small dark glass ball with a Siri-style voice wave inside, locked to the thinking state and drawn by a Metal color shader; palettes for searching, reading and writing crossfade… | `npx swiftpieces add ThoughtOrb` |

### Backgrounds — 2

| Component and docs | What it does | Install |
|---|---|---|
| [Silk](https://swiftpieces.com/docs/components/backgrounds/silk) | A slowly folding silk surface lit by a movable light and shaded from a real gradient normal in a Metal shader, in house block fabrics (the brand red among them) and an adaptive… | `npx swiftpieces add Silk` |
| [TouchGrid](https://swiftpieces.com/docs/components/backgrounds/touch-grid) | A Canvas dot grid that swells and warms into the brand red or another house block under the finger, springs back on release, and sends one dissipating ripple out from a tap | `npx swiftpieces add TouchGrid` |

### Cards — 4

| Component and docs | What it does | Install |
|---|---|---|
| [FlipCard](https://swiftpieces.com/docs/components/cards/flip-card) | A two-sided card you flip by tap or by dragging sideways | `npx swiftpieces add FlipCard` |
| [MotionCard](https://swiftpieces.com/docs/components/cards/motion-card) | A solid color card that tilts with the device's attitude through an exponential filter, easing into its limit and leveling out when the grip changes, with a fixed-light sheen and a… | `npx swiftpieces add MotionCard` |
| [ParallaxCard](https://swiftpieces.com/docs/components/cards/parallax-card) | An image card whose picture drifts slower than the scroll while a liquid glass caption panel drifts slower still, so the card reads in layers | `npx swiftpieces add ParallaxCard` |
| [SwipeDeck](https://swiftpieces.com/docs/components/cards/swipe-deck) | A gesture-driven card stack: the top card follows the finger and swings from where you grabbed it, a tinted liquid glass outcome badge buds in through the card's edge, leaning in… | `npx swiftpieces add SwipeDeck` |

### Controls — 5

| Component and docs | What it does | Install |
|---|---|---|
| [CommitButton](https://swiftpieces.com/docs/components/controls/commit-button) | A liquid glass async action button driven by one idle/loading/success/error/disabled phase: the signal glass capsule draws in around its label as a glass bubble buds out of its end… | `npx swiftpieces add CommitButton` |
| [ElasticButton](https://swiftpieces.com/docs/components/controls/elastic-button) | A ButtonStyle that squashes toward the touch point, stretches along the drag with rubber-band resistance, deepens after a hold and springs back with as much give as the pull put in | `npx swiftpieces add ElasticButton` |
| [FanStack](https://swiftpieces.com/docs/components/controls/fan-stack) | Overlapping avatars in liquid glass bubbles that melt into one shape where they overlap, then fan apart on tap or hold through necks that stretch and snap, the hidden faces budding… | `npx swiftpieces add FanStack` |
| [HoldToConfirm](https://swiftpieces.com/docs/components/controls/hold-to-confirm) | A press-and-hold liquid glass capsule for destructive or important actions: the signal tint wells out of the leading puck while held and sweeps through the glass, passing three… | `npx swiftpieces add HoldToConfirm` |
| [TimerDial](https://swiftpieces.com/docs/components/controls/timer-dial) | A countdown ring you set by dragging a liquid glass knob around it like the Timer dial, with a tick per step and a heavier detent every 5s | `npx swiftpieces add TimerDial` |

### Data — 5

| Component and docs | What it does | Install |
|---|---|---|
| [ActivityHeatmap](https://swiftpieces.com/docs/components/data/activity-heatmap) | A liquid glass streak calendar for habit, fitness, study and journaling apps: weeks of days drawn in one Canvas as rounded cells in solid steps from a pale red mix up to pure red,… | `npx swiftpieces add ActivityHeatmap` |
| [LiveStat](https://swiftpieces.com/docs/components/data/live-stat) | A liquid glass metric tile: a semibold display value that rolls with a spring and dims its decimals, a tinted delta chip, a sparkline you hold and scrub to retarget the value live… | `npx swiftpieces add LiveStat` |
| [Odometer](https://swiftpieces.com/docs/components/data/odometer) | A number whose digits roll on individual slots like a mechanical counter, carrying from the low digits up so unchanged digits never move, with softened slot edges while rolling,… | `npx swiftpieces add Odometer` |
| [RingBreakdown](https://swiftpieces.com/docs/components/data/ring-breakdown) | A composition ring of solid color blocks with rounded seams that you scrub by dragging around it, with a haptic at each slice boundary and a radial lift for the selected slice while… | `npx swiftpieces add RingBreakdown` |
| [ScrubChart](https://swiftpieces.com/docs/components/data/scrub-chart) | A liquid glass line or bar chart: a semibold readout with dimmed decimals beside a tinted glass delta chip, a glass flag that rides the scrub rule with the range's change budding… | `npx swiftpieces add ScrubChart` |

### Feedback — 5

| Component and docs | What it does | Install |
|---|---|---|
| [OutcomeScreen](https://swiftpieces.com/docs/components/feedback/outcome-screen) | A success, failure or empty outcome view sharing one choreography, where a ring draws, floods into a solid color block, the mark strokes in dark ink, one pulse lands with a haptic,… | `npx swiftpieces add OutcomeScreen` |
| [RatingScrub](https://swiftpieces.com/docs/components/feedback/rating-scrub) | A star rating you tap or scrub, with soft rounded stars that fill as solid blocks colored by the score and rise under your finger like soft keys, falling back in a ripple when you… | `npx swiftpieces add RatingScrub` |
| [ReactionToggle](https://swiftpieces.com/docs/components/feedback/reaction-toggle) | A liquid glass like or save toggle | `npx swiftpieces add ReactionToggle` |
| [SkeletonLoader](https://swiftpieces.com/docs/components/feedback/skeleton-loader) | Solid placeholder bones and a self-masking modifier that turns any layout, color blocks included, into one quiet shape sweeping a soft diagonal highlight on a shared clock, then… | `npx swiftpieces add SkeletonLoader` |
| [StatusMorph](https://swiftpieces.com/docs/components/feedback/status-morph) | One continuous stroke that spins as a loading arc, closes into a ring, floods into a solid block and draws a check in dark ink on success, or a cross with a nudge on failure, with… | `npx swiftpieces add StatusMorph` |

### Glass — 5

| Component and docs | What it does | Install |
|---|---|---|
| [GlassActionMenu](https://swiftpieces.com/docs/components/glass/glass-action-menu) | A liquid glass action menu | `npx swiftpieces add GlassActionMenu` |
| [GlassModeBar](https://swiftpieces.com/docs/components/glass/glass-mode-bar) | One liquid glass body that turns into whatever mode you pick | `npx swiftpieces add GlassModeBar` |
| [GlassQuickAdd](https://swiftpieces.com/docs/components/glass/glass-quick-add) | A liquid glass Quick add pill that folds up into a card | `npx swiftpieces add GlassQuickAdd` |
| [GlassSegments](https://swiftpieces.com/docs/components/glass/glass-segments) | A liquid glass segmented control: a signal-tinted glass indicator melted into a glass track as one surface | `npx swiftpieces add GlassSegments` |
| [GlassSurface](https://swiftpieces.com/docs/components/glass/glass-surface) | The public face of the SwiftPieces liquid glass: `.glassSurface` draws any view on a liquid glass capsule, rect, circle or concentric shape, and `GlassSurface.Group` melts… | `npx swiftpieces add GlassSurface` |

### Inputs — 12

| Component and docs | What it does | Install |
|---|---|---|
| [AddressField](https://swiftpieces.com/docs/components/inputs/address-field) | A liquid glass address field for checkout, delivery and sign-up | `npx swiftpieces add AddressField` |
| [AmountField](https://swiftpieces.com/docs/components/inputs/amount-field) | A currency amount entry that formats live in the user's locale as each digit lands (grouping, decimal separator, symbol before or after, the currency's own fraction digits), with a… | `npx swiftpieces add AmountField` |
| [DateRangePicker](https://swiftpieces.com/docs/components/inputs/date-range-picker) | A start-to-end date range picker on a paged month grid built from the environment calendar and locale, with the selection in liquid glass over the grid | `npx swiftpieces add DateRangePicker` |
| [ExpandingTrack](https://swiftpieces.com/docs/components/inputs/expanding-track) | A thumbless liquid glass slider: a glass bar that swells from 8pt to a 32pt bar under the finger with a solid color fill inside, shows detent dots while dragging, buds a glass… | `npx swiftpieces add ExpandingTrack` |
| [FilterRail](https://swiftpieces.com/docs/components/inputs/filter-rail) | A scrolling rail of liquid glass filter chips with optional counts, resting apart as their own bubbles | `npx swiftpieces add FilterRail` |
| [FormField](https://swiftpieces.com/docs/components/inputs/form-field) | A liquid glass text field whose label rests inside as a placeholder and glides up into a caption on focus or once filled, with an optional leading icon and help text | `npx swiftpieces add FormField` |
| [LocationPicker](https://swiftpieces.com/docs/components/inputs/location-picker) | A map picker for delivery, rides, events and listings: drag the map under a fixed red pin that lifts while the map moves and, when it settles, drops and presses into place with a… | `npx swiftpieces add LocationPicker` |
| [RangeSlider](https://swiftpieces.com/docs/components/inputs/range-slider) | A liquid glass dual-thumb slider: two glass bubble thumbs joined by a tinted glass span over a quiet line, with a glass readout chip joined above each thumb on a liquid neck; drag… | `npx swiftpieces add RangeSlider` |
| [ScrubStepper](https://swiftpieces.com/docs/components/inputs/scrub-stepper) | A liquid glass stepper: round minus and plus bubbles joined to a glass numeral pill by liquid necks | `npx swiftpieces add ScrubStepper` |
| [SecureEntry](https://swiftpieces.com/docs/components/inputs/secure-entry) | A liquid glass password field with a focus ring and a round glass reveal bubble joined to it that keeps focus | `npx swiftpieces add SecureEntry` |
| [SignaturePad](https://swiftpieces.com/docs/components/inputs/signature-pad) | A signature field that lays smooth, velocity-weighted ink into a Canvas as the finger moves, thinning on quick flicks and pooling on slow turns, over a baseline whose Sign here hint… | `npx swiftpieces add SignaturePad` |
| [TokenField](https://swiftpieces.com/docs/components/inputs/token-field) | A liquid glass tag and recipient field where each committed entry buds out of the glass input as a glass chip, born where it was typed while the input slides on, and chips wrap… | `npx swiftpieces add TokenField` |

### Lists — 7

| Component and docs | What it does | Install |
|---|---|---|
| [DepthCarousel](https://swiftpieces.com/docs/components/lists/depth-carousel) | Paged cards that recede in depth as they leave center and hand each page a phase value for inner parallax | `npx swiftpieces add DepthCarousel` |
| [DragSelectGrid](https://swiftpieces.com/docs/components/lists/drag-select-grid) | A multi-select photo and file grid where one drag paints a whole reading-order range the way the system photo library does, a sideways drag or a short hold starts painting while… | `npx swiftpieces add DragSelectGrid` |
| [FollowScroll](https://swiftpieces.com/docs/components/lists/follow-scroll) | A chat, log and live-feed scroll container that opens on the newest item and stays pinned to it while the reader is at the bottom, but never yanks them away once they scroll up to… | `npx swiftpieces add FollowScroll` |
| [PagedList](https://swiftpieces.com/docs/components/lists/paged-list) | An async/await infinite-scroll list that prefetches the next page a few rows before the end, never runs two loads at once, drops duplicate ids across pages, ignores stale responses… | `npx swiftpieces add PagedList` |
| [StatusTimeline](https://swiftpieces.com/docs/components/lists/status-timeline) | A vertical status timeline on liquid glass nodes: the live node is tinted and breathes, completed ones stamp to a tinted check as the ink runs down the line to the next stop, and a… | `npx swiftpieces add StatusTimeline` |
| [SwipeActionRow](https://swiftpieces.com/docs/components/lists/swipe-action-row) | Wraps any row in a liquid glass card whose swipe actions are tinted glass bubbles | `npx swiftpieces add SwipeActionRow` |
| [TaskRow](https://swiftpieces.com/docs/components/lists/task-row) | A task card with liquid glass chrome | `npx swiftpieces add TaskRow` |

### Media — 5

| Component and docs | What it does | Install |
|---|---|---|
| [AttachmentTray](https://swiftpieces.com/docs/components/media/attachment-tray) | A horizontal attachment strip for composers, support forms and listings: a liquid glass add tile opens the photo picker with the remaining limit, picks drop onto the strip as their… | `npx swiftpieces add AttachmentTray` |
| [LinkPreview](https://swiftpieces.com/docs/components/media/link-preview) | A rich card for any URL that holds its final size while a skeleton sweeps, then settles the page's image and title into place under a liquid glass host chip that is there from the… | `npx swiftpieces add LinkPreview` |
| [PhotoCropper](https://swiftpieces.com/docs/components/media/photo-cropper) | A crop step for profile photos, posts and listings that keeps the picked photo covering a frame of the chosen aspect at every zoom and offset, pinches around the fingers while it… | `npx swiftpieces add PhotoCropper` |
| [PhotoViewer](https://swiftpieces.com/docs/components/media/photo-viewer) | A full-screen photo surface with anchor-correct pinch zoom, momentum panning that gives a little at the bounds and rebounds, double-tap zoom about the tap, paging between images,… | `npx swiftpieces add PhotoViewer` |
| [StoryStrip](https://swiftpieces.com/docs/components/media/story-strip) | A Stories-style segment strip with a built-in clock that advances segments on a duration, a long-press hold that freezes the strip and buds a liquid glass Paused badge down out of… | `npx swiftpieces add StoryStrip` |

### Motion — 1

| Component and docs | What it does | Install |
|---|---|---|
| [DragToDismiss](https://swiftpieces.com/docs/components/motion/drag-to-dismiss) | A modifier that lets a photo, card, or sheet follow a two-axis drag, rounds and shrinks it toward the finger with progress over a styled scrim, then springs back or is tossed off… | `npx swiftpieces add DragToDismiss` |

### Navigation — 4

| Component and docs | What it does | Install |
|---|---|---|
| [FloatingDock](https://swiftpieces.com/docs/components/navigation/floating-dock) | A floating liquid glass dock: every item is its own glass bubble, resting apart, and the selected one floods with the signal tint | `npx swiftpieces add FloatingDock` |
| [IndexScrubber](https://swiftpieces.com/docs/components/navigation/index-scrubber) | An A to Z section index for long lists in any scroll view: the letters sit on a liquid glass rail on the trailing edge | `npx swiftpieces add IndexScrubber` |
| [StretchHeader](https://swiftpieces.com/docs/components/navigation/stretch-header) | A hero header for your own ScrollView and NavigationStack: a semibold display title and uppercase eyebrow over a solid block hero that stretches on overscroll, a title that shrinks… | `npx swiftpieces add StretchHeader` |
| [TrackingTabs](https://swiftpieces.com/docs/components/navigation/tracking-tabs) | Tabs on a liquid glass track over a paging ScrollView | `npx swiftpieces add TrackingTabs` |

### Sheets — 4

| Component and docs | What it does | Install |
|---|---|---|
| [ConfirmSheet](https://swiftpieces.com/docs/components/sheets/confirm-sheet) | A confirmation card that presents as a height-fitted bottom sheet or, inline, as a floating card you can drag away | `npx swiftpieces add ConfirmSheet` |
| [PermissionSheet](https://swiftpieces.com/docs/components/sheets/permission-sheet) | A pre-permission sheet that previews what it brings as a fanned stack of notification banners, each a tinted app tile, a line and now, that drop in one after another and deal the… | `npx swiftpieces add PermissionSheet` |
| [SpotlightTour](https://swiftpieces.com/docs/components/sheets/spotlight-tour) | A first-run feature tour for any screen: mark controls with .spotlightAnchor and .spotlightTour dims everything else through a cutout that springs from stop to stop as a red ring… | `npx swiftpieces add SpotlightTour` |
| [Toast](https://swiftpieces.com/docs/components/sheets/toast) | A single liquid glass toast | `npx swiftpieces add Toast` |

### Text — 4

| Component and docs | What it does | Install |
|---|---|---|
| [ExpandableText](https://swiftpieces.com/docs/components/text/expandable-text) | A paragraph clamped to a line limit that measures whether it is really truncated, and only then fades the end of its last line into a small liquid glass "more" pill; tapping grows… | `npx swiftpieces add ExpandableText` |
| [GlassText](https://swiftpieces.com/docs/components/text/glass-text) | Liquid Glass rendered on the actual glyph outlines of a string, one or several lines, set in the house semibold by default, with a specular frosted fallback below iOS 26, a solid… | `npx swiftpieces add GlassText` |
| [PictureHeadline](https://swiftpieces.com/docs/components/text/picture-headline) | A semibold headline with living pictures stuck between its words like a hand-placed collage | `npx swiftpieces add PictureHeadline` |
| [TextReveal](https://swiftpieces.com/docs/components/text/text-reveal) | Reveals a headline by characters, words or lines, rising from a baseline mask with a stagger sized to land in under a second, then grows a stroke of tinted liquid glass behind each… | `npx swiftpieces add TextReveal` |

## Other category pages reviewed

The [Animations](https://swiftpieces.com/components/animations) and [Haptics](https://swiftpieces.com/components/haptics) pages curate components from the catalog rather than adding distinct docs entries. The remaining category pages are the headers above.

## Implementation status

SwiftUI research is complete. The eight web equivalents above are installed in the Next.js app; source files remain in `apps/dashboard/components/ui/`. The original SwiftUI components remain reference-only.
