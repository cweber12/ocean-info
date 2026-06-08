# Information Architecture: Ocean Planner

## Site Map

- Planner `/`
  - Activity detail state `/?activity=:activityId&location=:locationId&date=:isoDate`
  - Future source details `/?activity=:activityId&location=:locationId&date=:isoDate&details=:sourceId`
- Future location guide `/locations/:locationId`
- Future activity guide `/activities/:activityId`
- Future about data `/data-sources`

The MVP should ship as a single-page planner. Future routes are documented here so naming and state models do not need to be reworked later.

## Navigation Model

- **Primary navigation**: No traditional multi-page nav for MVP. The main header contains brand, location, and date controls.
- **Secondary navigation**: Activity selector inside the planner. Use a left sidebar of clickable text options with six activities: Beach day, Dive, Surf, Tidepools, Sail, SUP/kayak.
- **Utility navigation**: Small links may appear in the footer or source-details area for data sources, privacy/key policy, and project notes. These are not first-viewport priorities.
- **Mobile navigation**: No hamburger menu for MVP. Use stacked planner controls and a horizontally scrollable or wrapped activity selector with clear selected state.

## Content Hierarchy

### Planner `/`

1. Header location/date controls -- This is the user's core planning question.
2. Recommendation summary -- The app should answer "Is this a good idea, and when should we go?" before showing raw metrics.
3. Best-time window -- Time-sensitive conditions are central for tidepools, surf, sailing, diving, and paddling.
4. Condition highlights -- Weather, tide, water, swell, wind, water quality, and marine-life notes summarized as readable states.
5. Caution popover -- Important cautions are available from a small icon trigger without making warnings a major part of the initial page.
6. Learning notes -- Family-friendly and nature-observation prompts that connect the activity to the place and conditions.
7. Source details -- Advanced/provenance information disclosed after the practical answer.

### Future Location Guide `/locations/:locationId`

1. Location overview -- Name, area, supported activities, and coastal context.
2. Best activity patterns -- Typical suitability by season/time/tide.
3. Station mappings -- Tide, buoy, weather, and advisory sources.
4. Notes and caveats -- Parking, access, source coverage, and safety disclaimers if added later.

### Future Activity Guide `/activities/:activityId`

1. Activity overview -- What conditions matter and why.
2. Planning checklist -- Beginner-friendly interpretation of condition groups.
3. Location fit -- Recommended coast locations for that activity.
4. Source details -- Where the data comes from.

## User Flows

### Plan a Coastal Outing

1. User lands on `/`.
2. User sees location and date controls, activity choices, and a default recommendation.
3. User selects a location.
   - If the selected location supports the current activity, the recommendation updates.
   - If not, the app explains which nearby activities fit that location.
4. User selects a date.
   - If data is available, summaries update for that date.
   - If data is unavailable, the app shows graceful placeholder guidance and source limitations.
5. User selects an activity.
6. User reads the recommendation, best time window, caution, and learning notes.

### Compare Activities for a Location

1. User selects a location and date.
2. User scans activity options.
3. User switches between activities.
4. The recommendation panel changes interpretation while preserving location and date.
5. User chooses the activity that has the best practical fit.

### Check Whether Conditions Are Safe Enough

1. User selects location, date, and activity.
2. User sees a small caution icon near the recommendation or condition summary.
3. User opens the caution popover if they want more safety context.
4. User adjusts timing, changes activity, or chooses another location if cautions are significant.

### Learn What to Notice

1. User selects a location, date, and activity.
2. User reads the learning notes below the recommendation.
3. User connects ocean conditions to observable details such as tidepool exposure, kelp movement, moon/tide timing, or marine-life seasonality.

## Naming Conventions

| Concept | Label in UI | Notes |
| --- | --- | --- |
| Main product view | Planner | More action-oriented than dashboard. |
| Activities | Activities | Use plain activity names, not modules. |
| Place selection | Location | Familiar label for beach/harbor/coastal spots. |
| Time selection | Date | Keep simple until time-specific controls are needed. |
| Main answer | Recommendation | Plain-language summary of suitability. |
| Ideal period | Best window | Friendly and practical. |
| Ocean metrics | Conditions | Broader than weather and easier than data groups. |
| Warnings | Cautions | Softer than alerts; shown through a small popover trigger by default. |
| Education prompts | What to notice | Better fit for homeschool and nature-observation use. |
| Provenance | Sources | Plain word for data origin. |

## Component Reuse Map

| Component | Used on | Behavior differences |
| --- | --- | --- |
| PlannerShell | Planner and future guide pages | Single-column mobile, two-column desktop. |
| PlannerControls | Planner | Controls location, date, and activity query state. |
| ActivitySelector | Planner and future activity guide | Left text sidebar on planner; static highlight on guides. |
| RecommendationPanel | Planner | Content changes by activity and selected context. |
| BestWindowCard | Planner | Prominent for tide-sensitive activities. |
| ConditionGrid | Planner | Shows different condition groups per activity. |
| CautionPopover | Planner and future location guide | Icon-triggered details; varies tone by severity. |
| LearningNotes | Planner and future activity guide | Educational and observational prompts. |
| SourceDetails | Planner and data-source page | Collapsible in planner; expanded reference view later. |

## Content Growth Plan

Growing content:

- location catalog from San Diego to Oceanside
- source mappings for tide, buoy, weather, water quality, and marine-life providers
- activity-specific recommendation rules
- learning notes by activity and location
- source detail/provenance records

The MVP should avoid a CMS and store this content in typed local modules. If the content grows beyond simple typed data files, add content collections or markdown files before adding a database.

## URL Strategy

- Pattern: `/`
- Query parameters:
  - `activity`: activity id, such as `tidepools`, `dive`, or `beach-day`
  - `location`: curated location id, such as `san-diego-la-jolla-shores`
  - `date`: ISO date, such as `2026-06-08`
  - `details`: optional source/detail panel id for future deep links

Example:

```txt
/?activity=tidepools&location=san-diego-la-jolla-shores&date=2026-06-08
```

Rules:

- Query state should be shareable.
- Invalid query values should fall back to safe defaults.
- Future detail routes should preserve the same activity, location, and date vocabulary.
