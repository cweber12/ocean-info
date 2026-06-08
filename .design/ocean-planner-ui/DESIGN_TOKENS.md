# Design Tokens: Tide Guide UI

## Output

The implementation token file is `src/app/tokens.css`.

## Philosophy

The tokens are derived from the revised Tide Guide direction: a professional coastal field guide with restrained moon and ocean warmth.

## Design Choices

- Backgrounds use moonstone white and porcelain blue-gray rather than warm cream.
- Primary accents use muted sea glass and deep ocean ink for a calmer, more professional read.
- The moon accent is warm but restrained and appears only where it clarifies hierarchy.
- Coral and lavender are no longer primary visual accents.
- Dark mode is a deep ocean field-guide palette rather than saturated teal.
- Corners stay at 8px or below for standard cards and controls, with full radius reserved for chips and pills.
- Spacing uses a practical 4/8px-derived scale with larger steps for planner sections.
- Motion is gentle and short; playful easing is available for small selected-state transitions.

## Token Categories

- Semantic colors
- Light and dark mode palettes
- Typography
- Spacing
- Layout widths
- Radius
- Shadows
- Motion
- Breakpoints
- Component-level planner tokens

## Implementation Notes

Future UI work should import `src/app/tokens.css` before component styles and reference semantic tokens instead of hardcoded values.
