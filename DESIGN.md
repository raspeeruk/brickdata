# BrickData — Design Brief

## Aesthetic Direction
**Survey Grid / Land Registry Record** — the site looks and feels like you're reading an official surveyor's working document. Graph-paper grid lines permeate every page. Numbers dominate. No estate agent marketing, no lifestyle photography, no "dream home" copy. Pure data, beautifully presented.

## Target Audience
- **Homeowners** checking their property's value trajectory and energy performance
- **Buyers** researching streets, postcodes, and neighbourhoods before viewing
- **Landlords** monitoring portfolio values and compliance (EPC ratings)
- **Property investors** comparing areas by price growth, yield potential, crime stats
- **Emotional state**: Analytical, comparison-mode, data-hungry. They want numbers, not narratives.

## Typography
- **Headings**: Vollkorn (700, 900) — scholarly transitional serif with sharp ink traps. Feels like a government report header. Authoritative without being cold.
- **Body**: Chivo (300, 400, 500) — geometric sans-serif, clean and neutral. Disappears into the data. Excellent x-height for dense layouts.
- **Data/Mono**: IBM Plex Mono (400, 500, 600) — every price, percentage, rating, and reference number in monospace. This is the real star font — it appears more than either heading or body.
- **Scale**: 15px body / 52px h1 / 80px hero stat numbers — 3x+ jumps. Data numbers always outsized.

## Color Palette
| Role | Hex | Usage |
|------|-----|-------|
| Dominant | #E07A2F | Surveyor orange — section headers, active states, the "OS map" color. 60% of branded surfaces. |
| Accent | #2B5EA7 | Grid blue — links, interactive elements, map markers. Sharp contrast against orange. |
| Background | #F3F1EC | Stone paper — warm grey-cream, like an official document. Never pure white. |
| Surface | #FEFDFB | Near-white — cards, elevated panels. Barely perceptible lift from background. |
| Text Primary | #1C1B19 | Dense black — body copy, all data values. |
| Text Secondary | #7A7770 | Warm grey — labels, metadata, captions. |
| Grid Lines | #D5D2CA | Subtle — the ever-present graph paper grid. Visible but never distracting. |
| Positive | #2D7A3E | Dark green — price increases, good EPC ratings (A/B). |
| Negative | #C23B22 | Muted red — price decreases, poor ratings (F/G). |

## Layout Rules
- **Hero**: Search bar only. No image, no illustration, no tagline beyond "UK property data for every address." Giant monospace postcode in the background at 20% opacity.
- **Grid**: Graph-paper grid lines visible as a CSS background pattern across the entire site. Content sits on the grid. 12-column with 8px gutters.
- **Cards**: Sharp corners (0 border-radius). 1px border in grid-line colour. No shadows. On hover: orange left-border accent (3px).
- **Sections**: Separated by double horizontal rules (like a ledger). No wave dividers, no gradients, no overlapping sections.
- **Max width**: 1200px container. Data tables can break out to 1400px.
- **Spacing philosophy**: Dense. This is a data tool. Generous vertical spacing between sections, tight spacing within data groups.
- **Numbers**: Every price, score, and measurement rendered in IBM Plex Mono at outsized scale. £425,000 should be the most prominent element on any property page, not a photo.
- **Reference numbers**: Every page displays a monospace reference ID (e.g., "REF: SW1A-2AA/DOWNING-ST/10") in the top-right corner, like a surveyor's document.
- **Maps**: Embedded maps use muted/greyscale tile style, not default Google Maps colours.

## Banned Patterns
- No hero images or lifestyle photography
- No rounded corners anywhere
- No purple (Rightmove/Zoopla territory)
- No gradients on any surface
- No "Get Started" or "Learn More" CTAs — use data-specific actions: "View price history", "Check EPC rating", "Compare postcodes"
- No testimonials, no social proof, no trust badges
- No cards with equal 3-column grid as primary layout
- No animations beyond subtle hover transitions
- Never display "estimate" or "valuation" — only verified, sourced data

## Reference Mood
- **Ordnance Survey Explorer maps** — the orange covers, grid references, functional beauty
- **Land Registry official documents** — reference numbers, stamps, structured data
- **Financial Times data pages** — dense, monospace numbers, no decoration, the data IS the design

## Unique Hook
**The Grid** — a subtle but ever-present graph-paper grid pattern covers every page, making the entire site feel like a surveyor's working document. Combined with monospace reference numbers on every page and outsized IBM Plex Mono price figures, BrickData looks like no property site that exists. It's not an estate agent — it's a land registry terminal you can search.
