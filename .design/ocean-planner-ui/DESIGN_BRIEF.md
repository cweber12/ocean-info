# Design Brief: Ocean Planner UI

## Problem

People planning coastal outings have to piece together conditions from weather, tide, surf, water quality, water temperature, and marine-life sources. That is especially frustrating for homeschool parents planning a safe, educational day and for diving groups that need useful ocean context without sorting through raw marine dashboards.

The human friction is confidence: users want to know where to go, when to go, what activity fits the day, and what to pay attention to.

## Solution

The interface acts as a polished coastal planning guide. A user chooses a location, date, and activity, then sees a clear activity-specific summary: best time window, condition highlights, and learning or observation notes. Cautions stay available through a small icon-triggered popover instead of occupying major first-load space.

The UI should translate raw coastal data into practical planning language first, with deeper source details available after the main answer is clear.

The page/product name should be **Ocean Planner**. It is more relevant to the theme than "Ocean Info" while sounding useful, calm, credible, and concise.

## Experience Principles

1. Polished clarity over decorative softness -- Keep the page professional and clean first; moon and ocean cues should support the interface rather than dominate it.
2. Confidence over raw data -- Lead with a plain-language recommendation, then expose the condition details that support it.
3. Connected context over isolated metrics -- Relate tide, weather, water, wildlife, and activity needs so users understand why a time or place works.

## Aesthetic Direction

- **Philosophy**: Professional coastal field guide with moon-tide warmth. Use Scandinavian clarity and field-guide restraint, not a pastel wellness app.
- **Tone**: Light, calm, competent, polished, warm, and quietly thematic.
- **Reference points**: Clean family nature guides, modern museum/field-study interfaces, refined coastal lodging sites, premium education tools, and practical planning dashboards with strong typography.
- **Anti-references**: Surf-bro branding, hardcore nautical dashboards, dense NOAA-style tables as the first experience, generic blue SaaS UI, astrology-heavy visuals, dark dive-computer styling, childish homeschool graphics, busy patterned backgrounds, and overly pastel wellness palettes.

### Redesign Requirements

- **Page name**: Use `Ocean Planner`, not `Ocean Info` or `Moon Ocean Planner`.
- **Header planner**: Move the location/date planner controls into the main header. Omit the current rail intro copy, and do not put the planner controls in a card-like background.
- **Activity navigation**: Replace the activity card grid with a left sidebar of clickable text activity options. The selected activity's recommendation, windows, conditions, and notes display to the right.
- **Page atmosphere**: Use a sunset-themed top region with ocean blue underneath. The effect should feel polished and spacious, not decorative or busy.
- **Color scheme**: Replace the current cream/teal/gold/lavender palette with a more restrained professional palette: moonstone white, porcelain blue-gray, deep ocean ink, muted sea glass, and one warm moon accent. Coral or lavender may appear only as small secondary accents, not dominant brand colors.
- **Typography**: Replace the current Avenir/system-feeling stack with a more distinctive professional pairing. Recommended: a refined serif or humanist display face for headings and a clean readable sans for body text. Avoid generic SaaS typography.
- **Background**: Remove the current large pastel diagonal/patterned background treatment. Use a cleaner page background with subtle depth: quiet bands, very soft texture, or disciplined surface layering.
- **Icon/mark**: Replace the current custom crescent mark with a more polished moon/tide brand mark or a lucide-based icon treatment. It should feel like a premium planning guide, not a hand-made placeholder.
- **Visual density**: Keep the page easy for homeschool parents to scan, but make spacing, card alignment, and hierarchy feel deliberate and mature.

## Existing Patterns

The current scaffold is a simple Vite + React + TypeScript static app.

- Typography: Avenir Next / Avenir / Segoe UI fallback stack in `src/app/styles.css`; this should be replaced.
- Colors: CSS variables in `src/app/tokens.css`; current colors lean too warm/pastel and should be replaced with the revised professional moon/ocean palette.
- Spacing: Simple mobile-first spacing with 12px to 32px layout increments.
- Components: Planner shell, header, location/date controls, activity selector, recommendation panel, best-window card, condition grid, caution popover, and what-to-notice cards.
- Icons: `lucide-react` is available and should be preferred for interface icons.

## Component Inventory

| Component | Status | Notes |
| --- | --- | --- |
| App shell | Modify | Header contains brand, context, and planner controls over a sunset top region; main content sits over ocean blue. |
| Brand mark | Modify | Replace the current custom crescent with a more polished moon/tide mark or lucide-based symbol. |
| Location selector | Modify | Move into the main header without a card background. |
| Date selector | Modify | Move into the main header without a card background. |
| Activity selector | Modify | Use a left sidebar of clickable text options instead of activity cards. |
| Recommendation summary | New | Primary answer for the selected activity/date/location. |
| Best-time window | New | Show ideal time range and reason, especially tide-sensitive activities. |
| Condition chips | Modify | Replace raw data-need chips with meaningful condition states. |
| Caution popover | New | Use a small icon button to reveal water quality, wind, surf, closures, or other cautions on demand. |
| Learning notes | New | Short "what to notice" section for homeschool and nature-observation use. |
| Source details | New | Collapsible detail area for advanced users and provenance. |

## Key Interactions

- A user selects a location, date, and activity. The planner updates the recommendation summary and supporting condition cards.
- Activity selection happens in a left text sidebar and changes the interpretation of the same data. For example, a low tide can be excellent for tidepools and less important for beach day.
- Cautions should be light on the initial page: show a small icon button with plain label text for assistive technology, then reveal caution details in a popover.
- Details should progressively disclose source-level information without overwhelming first-time users.
- The brand/header should immediately communicate `Ocean Planner` and feel credible enough for planning real coastal outings.

## Responsive Behavior

Mobile is the primary layout. The planner starts as a single-column workflow:

1. Location and date
2. Activity text selector
3. Recommendation summary
4. Condition details
5. Learning/source notes

Tablet and desktop use a header planner plus a two-column main layout where the left sidebar contains activity text navigation and the right side shows recommendations and details.

Touch targets must be at least 44px. Text in cards and buttons must wrap cleanly without overflow.

## Accessibility Requirements

- Maintain WCAG AA contrast for text, controls, and caution states.
- Any text placed over the sunset or ocean background must meet contrast requirements against that surface; prefer dark text on the sunset header and light or card-contained text over ocean blue.
- All controls must be keyboard reachable and visibly focused.
- Activity tabs or segmented controls must expose selected state to assistive technology.
- Caution popovers must have an accessible button label, visible focus, `aria-expanded`, and text that does not rely on color alone.
- Native date and select controls are acceptable for the first version.
- Support reduced-motion preferences if transitions are added.

## Out of Scope

- Real API integration and live condition scoring.
- User accounts, saved trips, shared group planning, or user-submitted sightings.
- Maps and arbitrary coordinate search.
- Private API key handling.
- Full activity detail pages.
- Design review screenshots; those happen after the UI is built.
