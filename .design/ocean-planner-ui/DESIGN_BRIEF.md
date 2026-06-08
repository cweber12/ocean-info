# Design Brief: Ocean Planner UI

## Problem

People planning coastal outings have to piece together conditions from weather, tide, surf, water quality, water temperature, and marine-life sources. That is especially frustrating for homeschool parents planning a safe, educational day and for diving groups that need useful ocean context without sorting through raw marine dashboards.

The human friction is confidence: users want to know where to go, when to go, what activity fits the day, and what to pay attention to.

## Solution

The interface acts as a friendly ocean planning workspace. A user chooses a location, date, and activity, then sees a clear activity-specific summary: best time window, condition highlights, cautions, and learning or observation notes.

The UI should translate raw coastal data into practical planning language first, with deeper source details available after the main answer is clear.

## Experience Principles

1. Confidence over raw data -- Lead with a plain-language recommendation, then expose the condition details that support it.
2. Lightness over heaviness -- Make the app feel fun, calm, and approachable without hiding safety or advisory information.
3. Connected context over isolated metrics -- Relate tide, weather, water, wildlife, and activity needs so users understand why a time or place works.

## Aesthetic Direction

- **Philosophy**: Coastal moon-garden, combining Scandinavian clarity with soft ocean, moon, yoga, and connection cues.
- **Tone**: Fun, light, calm, practical, gently magical.
- **Reference points**: Family-friendly nature planning tools, soft wellness apps, coastal field guides, and clean activity planners.
- **Anti-references**: Surf-bro branding, hardcore nautical dashboards, dense NOAA-style tables as the first experience, generic blue SaaS UI, astrology-heavy visuals, and dark dive-computer styling.

## Existing Patterns

The current scaffold is a simple Vite + React + TypeScript static app.

- Typography: Avenir Next / Avenir / Segoe UI fallback stack in `src/app/styles.css`.
- Colors: CSS variables in `:root`, currently shell neutrals, teal accent, soft teal chips, and dark-mode overrides.
- Spacing: Simple mobile-first spacing with 12px to 32px layout increments.
- Components: One app shell with header, location/date controls, and activity cards. No shared reusable UI components exist yet.

## Component Inventory

| Component | Status | Notes |
| --- | --- | --- |
| App shell | Modify | Convert from scaffold layout into a planning workspace. |
| Location selector | Modify | Keep simple select initially; later support grouped coastal areas or searchable locations. |
| Date selector | Modify | Keep native date input with clearer nearby labels and default date behavior. |
| Activity selector | New | Use tabs or segmented cards for beach day, dive, surf, tidepools, sail, and SUP/kayak. |
| Recommendation summary | New | Primary answer for the selected activity/date/location. |
| Best-time window | New | Show ideal time range and reason, especially tide-sensitive activities. |
| Condition chips | Modify | Replace raw data-need chips with meaningful condition states. |
| Safety/advisory callout | New | Highlight water quality, wind, surf, closures, or other cautions without alarming styling. |
| Learning notes | New | Short "what to notice" section for homeschool and nature-observation use. |
| Source details | New | Collapsible detail area for advanced users and provenance. |

## Key Interactions

- A user selects a location, date, and activity. The planner updates the recommendation summary and supporting condition cards.
- Activity selection changes the interpretation of the same data. For example, a low tide can be excellent for tidepools and less important for beach day.
- Advisory states should be visually distinct and plain-spoken: users should immediately know whether to proceed, adjust timing, or choose another activity.
- Details should progressively disclose source-level information without overwhelming first-time users.

## Responsive Behavior

Mobile is the primary layout. The planner starts as a single-column workflow:

1. Location and date
2. Activity selector
3. Recommendation summary
4. Condition details
5. Learning/source notes

Tablet and desktop can use a two-column layout where the left side keeps filters and activity selection visible while the right side shows recommendations and details.

Touch targets must be at least 44px. Text in cards and buttons must wrap cleanly without overflow.

## Accessibility Requirements

- Maintain WCAG AA contrast for text, controls, and advisory states.
- All controls must be keyboard reachable and visibly focused.
- Activity tabs or segmented controls must expose selected state to assistive technology.
- Advisory and recommendation updates should use semantic headings and status text, not color alone.
- Native date and select controls are acceptable for the first version.
- Support reduced-motion preferences if transitions are added.

## Out of Scope

- Real API integration and live condition scoring.
- User accounts, saved trips, shared group planning, or user-submitted sightings.
- Maps and arbitrary coordinate search.
- Private API key handling.
- Full activity detail pages.
- Design review screenshots; those happen after the UI is built.
