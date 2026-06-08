# Design Tokens: Ocean Planner UI

## Output

The implementation token file is `src/app/tokens.css`.

## Philosophy

The tokens are derived from the coastal moon-garden direction: Scandinavian clarity with soft ocean, moon, yoga, and connection cues.

## Design Choices

- Backgrounds use warm shell neutrals rather than plain white.
- Primary accents use ocean teal for action and trust.
- Secondary accents add coral, moon gold, kelp green, and lavender so the interface does not become a one-note blue ocean palette.
- Dark mode is cool moonlit teal rather than inverted light mode.
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
