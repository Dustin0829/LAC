# Design System Inspired by Vyro

## 1. Visual Theme & Atmosphere

Vyro embodies a modern, creator-centric aesthetic that balances playful energy with professional credibility. The design exudes confidence and accessibility, designed for content creators seeking monetization opportunities. Clean typography, vibrant accent colors, and generous whitespace create an inviting, uncluttered experience. The system emphasizes clarity and directness—every interaction propels users toward action. The visual language combines bold headlines with subtle depth, trust-building imagery, and a tech-forward approach that feels approachable rather than intimidating.

**Key Characteristics**

- Bold, confident typography with strong visual hierarchy
- Bright, action-oriented primary accent (`#00ABF4` / `#0EA5E9`)
- High contrast between content and backgrounds for readability
- Generous spacing and breathing room throughout
- Soft shadows for subtle elevation without heaviness
- Rounded, friendly corners on interactive elements
- Clean, minimalist aesthetic with strategic use of color
- Focus on content visibility and user engagement

## 2. Color Palette & Roles

### Primary

- **Primary CTA** (`#00ABF4`): Dominant button and interactive element background; conveys energy and encourages action
- **Primary CTA Alt** (`#0EA5E9`): Secondary primary accent for hover states and emphasis
- **Hyperlink Blue** (`#0000EE`): Standard link color, maintains web conventions for discoverability

### Accent Colors

- **Accent Lime** (`#C0FF73`): Highlight and accent applications; draws attention to secondary information
- **Accent Pink** (`#FFE0E0`): Soft highlight and background tint for secondary content sections

### Neutral Scale

- **Text Dominant** (`#000000`): Primary text and heavy typography; highest contrast elements
- **Text Secondary** (`#636D79`): Secondary text, labels, and descriptive copy; reduced emphasis
- **Text Tertiary** (`#444444`): Placeholder, disabled, and de-emphasized text
- **Text On Dark** (`#FFFFFF`): Text on dark backgrounds or overlay contexts
- **Subtle Background** (`#1C1C1C`): Very dark background for high-contrast scenarios

### Surface & Borders

- **Surface Default** (`#FFFFFF`): Primary background and card surfaces
- **Surface Light** (`#F4F7F9`): Subtle background tint for secondary sections
- **Surface Lighter** (`#F8FAFC`): Lightest background tint; used sparingly
- **Border Light** (`#DDE5ED`): Subtle dividers and border strokes
- **Surface Alt** (`#D8E7F2`): Soft blue-tinted background for distinction

### Semantic / Status

- **Neutral Warm** (`#7D6161`): Neutral warm tone for edge cases and specific content contexts

## 3. Typography Rules

### Font Family

**Primary**: Poppins (sans-serif fallback: system font stack)
`font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Secondary**: System sans-serif
`font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / H1 | Poppins | 66px | 600 | 69.3px | normal | Hero headlines; maximum visual impact |
| Heading / H2 | Poppins | 60px | 700 | 72px | normal | Section headers; strong emphasis |
| Body / Paragraph | Poppins | 15px | 500 | 20px | normal | Primary content text; readable and approachable |
| Input Placeholder | Poppins | 14px | 500 | 14px | normal | Form field text and labels |
| Link / Navigation | sans-serif | 12px | 400 | normal | normal | Navigation items, links, secondary buttons |
| Caption / Small Text | sans-serif | 12px | 400 | normal | normal | Metadata, fine print, tertiary information |

### Principles

- **Contrast First**: All typography maintains minimum 4.5:1 contrast against backgrounds for accessibility
- **Size Progression**: Each level steps distinctly to establish clear visual hierarchy
- **Weight Matters**: Weight changes reinforce importance; avoid relying solely on size
- **Generosity**: Line heights exceed minimum standards for comfortable reading
- **Simplicity**: Limited typeface stack reduces cognitive load and loads efficiently
- **Personality**: Poppins conveys friendliness; system fonts ensure performance and reliability

## 4. Component Stylings

### Buttons

#### Primary Button (CTA)
- **Background**: `#00ABF4`
- **Text Color**: `#FFFFFF`
- **Padding**: `12px 24px`
- **Border Radius**: `18px`
- **Font Size**: `14px` (Poppins)
- **Font Weight**: `500`
- **Line Height**: `14px`
- **Box Shadow**: `rgba(0, 0, 0, 0.12) 0px 3px 8px 0px`
- **Hover State**: Background lightens to `#0EA5E9`, shadow intensifies
- **Active State**: Background deepens, slight inset effect
- **Disabled**: Opacity `0.6`, cursor `not-allowed`, no shadow

#### Secondary Button (Ghost)
- **Background**: `rgba(0, 0, 0, 0)` (transparent)
- **Text Color**: `#0000EE`
- **Padding**: `7px 13px`
- **Border Radius**: `99px`
- **Font Size**: `12px` (sans-serif)
- **Font Weight**: `400`
- **Line Height**: `normal`
- **Border**: `1px solid #0000EE`
- **Box Shadow**: `none`
- **Hover State**: Background `rgba(0, 0, 238, 0.05)`, border color deepens
- **Active State**: Background `rgba(0, 0, 238, 0.1)`

#### Text Button (Minimal)
- **Background**: transparent
- **Text Color**: `#000000`
- **Padding**: `0px`
- **Border Radius**: `0px`
- **Font Size**: `14px` (Poppins)
- **Font Weight**: `500`
- **Line Height**: `14px`
- **Border**: none
- **Box Shadow**: `none`
- **Hover State**: Text color shifts to `#0000EE`, underline appears
- **Active State**: Color `#00ABF4`

### Cards & Containers

#### Standard Card
- **Background**: `#FFFFFF`
- **Border**: `1px solid #DDE5ED`
- **Border Radius**: `24px`
- **Padding**: `24px`
- **Box Shadow**: `rgba(0, 0, 0, 0.12) 0px 3px 8px 0px`
- **Hover State** (interactive): Shadow intensifies to `rgba(0, 0, 0, 0.16) 0px 6px 12px 0px`

#### Light Background Section
- **Background**: `#F4F7F9`
- **Border**: none
- **Border Radius**: `0px`
- **Padding**: `64px 40px`
- **Box Shadow**: `none`

#### Alt Surface
- **Background**: `#D8E7F2`
- **Border**: `1px solid #DDE5ED`
- **Border Radius**: `18px`
- **Padding**: `20px`
- **Box Shadow**: `none`

### Inputs & Forms

#### Text Input
- **Background**: `#FFFFFF`
- **Border**: `1px solid #DDE5ED`
- **Border Radius**: `39px`
- **Padding**: `12px 20px`
- **Font Size**: `14px` (Poppins)
- **Font Weight**: `500`
- **Text Color**: `#000000`
- **Placeholder Color**: `#636D79`
- **Line Height**: `14px`
- **Box Shadow**: `none`
- **Focus State**: Border color `#00ABF4`, box-shadow `0px 0px 0px 3px rgba(0, 171, 244, 0.1)`
- **Error State**: Border color `#FF6B6B`, text color `#D32F2F`

#### Input Label
- **Font Size**: `14px` (Poppins)
- **Font Weight**: `500`
- **Color**: `#000000`
- **Margin Bottom**: `8px`
- **Display**: `block`

### Navigation

#### Top Navigation Bar
- **Background**: `rgba(0, 0, 0, 0)` (transparent)
- **Padding**: `32px 0px 16px 0px`
- **Height**: `auto`
- **Border**: none
- **Box Shadow**: none
- **Link Font Size**: `12px`
- **Link Font Weight**: `400`
- **Link Color**: `#000000`
- **Link Hover**: Color shifts to `#0000EE`

#### Breadcrumb Navigation
- **Font Size**: `12px`
- **Font Weight**: `400`
- **Text Color**: `#636D79`
- **Separator**: `/` with `12px` margin sides
- **Active Item Color**: `#000000`

### Badges & Labels

#### Standard Badge
- **Background**: `#F4F7F9`
- **Text Color**: `#636D79`
- **Padding**: `6px 12px`
- **Border Radius**: `12px`
- **Font Size**: `12px`
- **Font Weight**: `500`
- **Border**: `1px solid #DDE5ED`

#### Success Badge
- **Background**: `#C0FF73`
- **Text Color**: `#000000`
- **Padding**: `6px 12px`
- **Border Radius**: `12px`
- **Font Size**: `12px`
- **Font Weight**: `600`

## 5. Layout Principles

### Spacing System

**Base Unit**: `8px`

**Scale with contexts**:
- `8px`: Tight spacing within components, button padding
- `12px`: Small gaps, internal form spacing
- `16px`: Standard padding for content blocks
- `20px`: Input padding, card internal spacing
- `24px`: Card padding, section padding
- `28px`: Comfortable gap between elements
- `32px`: Section padding, container spacing
- `40px`: Large section padding
- `52px`: Gap between major content sections
- `64px`: Full section vertical spacing
- `72px`: Large container padding
- `80px`: Maximum spacing between sections

**Usage**:
- Gaps between flex/grid items: `28px`, `52px`, `64px`
- Card/container padding: `20px`, `24px`, `32px`
- Button/input padding: `8px`, `12px`, `16px`
- Section vertical spacing: `64px`, `80px`

### Grid & Container

- **Max Container Width**: `1440px`
- **Grid System**: 12-column responsive grid with flexible gutters
- **Gutter**: `24px` on large screens, `16px` on medium, `12px` on small
- **Section Patterns**: Full-bleed sections with internal padding of `40px` to `80px`
- **Content Width**: Typical max content width `1200px` for readability

### Whitespace Philosophy

Vyro embraces aggressive whitespace to guide attention and reduce cognitive overload. Every section receives breathing room through generous padding and gaps. Empty space around CTAs highlights their importance. Text rarely spans full container width; content is centered with clear margins. This spaciousness conveys premium positioning and respects user attention.

### Border Radius Scale

- **Small Radius**: `12px` (badges, subtle elements)
- **Medium Radius**: `18px` (standard buttons, small cards)
- **Large Radius**: `24px` (image containers, large cards)
- **Full Radius**: `39px` (input fields, fully rounded elements)
- **Extra Full**: `99px` (pill-shaped buttons, rounded badges)

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow, `box-shadow: none` | Text-only buttons, labels, badges |
| Raised | `rgba(0, 0, 0, 0.12) 0px 3px 8px 0px` | Standard buttons, cards, form inputs |
| Elevated | `rgba(0, 0, 0, 0.16) 0px 6px 12px 0px` | Hover state cards, floating actions |
| Prominent | `rgba(0, 0, 0, 0.2) 0px 12px 24px 0px` | Modals, overlays, highest-priority elements |

**Shadow Philosophy**: Shadows are restrained and subtle, reinforcing hierarchy without theatrical depth. Shadows emerge on interaction (hover, focus) to provide feedback. The soft shadow blur (`8px` base, increasing with elevation) creates approachability rather than harshness. All shadows use black with controlled opacity to work across backgrounds.

## 7. Do's and Don'ts

### Do

- Use `#00ABF4` / `#0EA5E9` for all primary CTAs and essential interactive elements
- Maintain `#000000` text on light backgrounds for maximum contrast and readability
- Apply `24px` border radius to image containers and large cards
- Space sections vertically with `64px` to `80px` for breathing room
- Use Poppins for all headings and primary navigation
- Add `rgba(0, 0, 0, 0.12) 0px 3px 8px 0px` shadow to raised components
- Center content blocks with max-width `1200px` within `1440px` containers
- Use `#636D79` for secondary text and helper copy
- Round button corners at `18px` minimum for soft, modern appearance
- Include hover state transitions (150ms ease) for all interactive elements

### Don't

- Avoid using text color `#000000` on `#00ABF4` backgrounds; use `#FFFFFF` instead
- Don't use border radius smaller than `12px` on user-facing interactive elements
- Avoid mixing Poppins and system fonts in the same heading
- Don't place critical information in shadows; use color or size instead
- Avoid rigid, sharp corners; prefer rounded corners throughout
- Don't use `#0000EE` for large text blocks; reserve it for links and accents
- Avoid nesting more than `2px` borders on containers
- Don't reduce padding below `8px` on internal component spacing
- Avoid shadow stacking; use single, precise shadows per elevation level
- Don't exceed `2` font sizes within a single paragraph

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | 320px – 640px | Single column, `16px` gutter, `24px` section padding, font sizes -2px |
| Tablet | 641px – 1024px | 2–6 column grid, `20px` gutter, `40px` section padding, full typography scale |
| Desktop | 1025px – 1440px | 12-column grid, `24px` gutter, `64px–80px` section padding, all features visible |
| Large | 1441px+ | Constrained max-width `1440px`, centered layout, expanded whitespace |

### Touch Targets

- **Minimum Target Size**: `44px × 44px` for all interactive elements (buttons, links, inputs)
- **Button Padding**: Minimum `12px` vertical, `16px` horizontal
- **Link Minimum Padding**: `8px` to meet touch guidelines
- **Spacing Between Targets**: Minimum `8px` to prevent accidental taps
- **Icon Size**: Minimum `24px × 24px` for standalone icons

### Collapsing Strategy

- **Navigation**: On mobile, collapse horizontal nav to hamburger menu or vertical stack
- **Typography**: Reduce H1 from `66px` to `42px` on mobile, H2 from `60px` to `36px`
- **Spacing**: Reduce vertical section gaps from `64px` to `40px`, then `28px` on small screens
- **Container Padding**: Reduce from `40px` to `24px` on tablet, `16px` on mobile
- **Grid Columns**: Shift from 12-column to 6-column on tablet, 1-column on mobile
- **Cards**: Stack card grids vertically on mobile; maintain side-by-side on tablet+
- **Button Width**: On mobile, buttons expand to fill available width (minus gutter padding)
- **Images**: Lazy-load images on mobile; maintain high-quality on desktop

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA**: Bright Sky Blue (`#00ABF4`)
- **Primary CTA Hover**: Cyan (`#0EA5E9`)
- **Text / Headings**: Pure Black (`#000000`)
- **Text Secondary**: Slate Gray (`#636D79`)
- **Links**: Web Blue (`#0000EE`)
- **Backgrounds**: White (`#FFFFFF`)
- **Background Light**: Subtle Blue-Gray (`#F4F7F9`)
- **Borders**: Light Blue-Gray (`#DDE5ED`)
- **Accent Highlight**: Lime Green (`#C0FF73`)

### Iteration Guide

1. **All primary buttons use `#00ABF4` background with `#FFFFFF` text, `18px` border radius, and `rgba(0, 0, 0, 0.12) 0px 3px 8px 0px` shadow.**

2. **Typography hierarchy: H1 is `66px` Poppins `600`, H2 is `60px` Poppins `700`, body is `15px` Poppins `500`, links are `12px` sans-serif `400`.**

3. **Spacing scale: Use `8px`, `12px`, `16px`, `20px`, `24px`, `28px`, `32px`, `40px`, `52px`, `64px`, `72px`, or `80px` — no arbitrary spacing values.**

4. **All interactive elements (buttons, inputs, cards) include `24px` or `18px` border radius; never use sharp corners.**

5. **Text on light backgrounds is `#000000`; secondary text is `#636D79`; tertiary is `#444444`.**

6. **Input fields have `39px` border radius, `12px 20px` padding, `#DDE5ED` border, and focus state `box-shadow: 0px 0px 0px 3px rgba(0, 171, 244, 0.1)`.**

7. **Cards and raised surfaces receive `rgba(0, 0, 0, 0.12) 0px 3px 8px 0px` shadow; no deeper elevations unless explicitly a modal or overlay.**

8. **Hover states appear on buttons, links, and cards; transitions should be `150ms ease` without jarring changes.**

9. **All containers constrain to max-width `1200px` within `1440px` viewport, centered with equal horizontal margins.**

10. **On mobile (below 641px), collapse typography by 2–4px, reduce section gaps to `40px`, and stack all multi-column layouts to single column.**