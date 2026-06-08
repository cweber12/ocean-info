# Build Tasks: Ocean Planner UI

Generated from: `.design/ocean-planner-ui/DESIGN_BRIEF.md`  
Date: 2026-06-08

## Foundation

- [x] **Planner data model**: Add typed placeholder planning content for recommendations, best windows, condition states, cautions, learning notes, and source summaries so the UI can render realistic activity-specific states without live APIs. _Reuses: `src/activities/*`, `src/locations/southern-california-coast.ts`; creates planner content module._
- [x] **Planner state from URL**: Add location, date, and activity state with safe defaults and query-parameter synchronization for shareable planner states. _Modifies: `src/app/App.tsx`; reuses IA URL strategy._

## Core UI

- [x] **Coastal moon-garden app shell**: Replace the scaffold grid with a planner-first layout that establishes the soft ocean/moon/yoga/connections aesthetic on first view. _Modifies: `src/app/App.tsx`, `src/app/styles.css`; reuses `src/app/tokens.css`._
- [ ] **Planner controls**: Build location/date controls and an accessible activity selector as the primary navigation of the page. _Modifies existing controls; creates activity selector UI._
- [ ] **Recommendation panel**: Build the main plain-language recommendation with suitability label, selected location/date/activity context, and one concise reason. _New component inside app or shared components._
- [ ] **Best-window and condition sections**: Build the best-time window card and condition grid with friendly labels for tide, swell, wind, weather, water quality, water temperature, and marine-life context. _New components; reuses planner data model._
- [ ] **Cautions and what-to-notice sections**: Build a clear advisory/caution callout plus family-friendly observation prompts that connect the activity to ocean conditions. _New components; reuses planner data model._
- [ ] **Source details**: Add a compact collapsible source/provenance section for advanced users without making source details prominent by default. _New component._

## Interactions & States

- [ ] **Activity switching states**: Ensure switching activities preserves location/date, updates all recommendation content, and clearly communicates selected state. Covers: selected, hover, focus, keyboard navigation. _Depends on: Planner controls._
- [ ] **Unsupported activity/location state**: Show a helpful fallback if a selected location does not support the selected activity, including nearby available activities. Covers: empty and alternate-path states. _Depends on: Planner data model._
- [ ] **Advisory severity states**: Style caution levels for calm, watch, and avoid states using text, icon/label treatment, and color without relying on color alone. _Depends on: Cautions section._

## Responsive & Polish

- [ ] **Mobile-first responsive layout**: Verify the planner reads in the IA order on mobile and becomes a two-column planning workspace on tablet/desktop. Breakpoints: 375px, 768px, 1024px, 1280px. _Modifies app shell and component CSS._
- [ ] **Accessibility pass**: Check WCAG AA contrast, visible focus, semantic headings, form labels, tablist/segmented-control semantics, and 44px touch targets. _Applies to all planner components._
- [ ] **Visual polish pass**: Refine spacing, rhythm, empty states, and microcopy so the UI feels light and fun without becoming decorative or vague. _Reuses coastal moon-garden tokens._
- [ ] **Build verification**: Run `npm run build` and fix any TypeScript or CSS regressions. _Final verification task._

## Review

- [ ] **Design review**: Run `/design-review` against the brief after the planner UI is built.
