# TenderHub Icons

Modern, professional SVG icons for the TenderHub application.

## Components

### LogoIcon

A geometric construction/building icon used in the sidebar logo.

**Features:**
- Building structure with windows
- Construction crane element
- Ground line for stability
- Transparent fill with solid outlines

**Usage:**
```tsx
import { LogoIcon } from '@/components/Icons';

<LogoIcon
  size={24}
  color="#10b981"
/>
```

**Props:**
- `size?: number` - Icon size in pixels (default: 24)
- `className?: string` - Additional CSS classes
- `color?: string` - Icon color (default: 'currentColor')

**Design:**
- Base building with 4 windows
- Crane tower with horizontal arm
- Crane hook and counterweight
- Ground line element
- Works well at 24-32px sizes

---

### HeaderIcon

A minimalist house/dashboard icon for the dashboard header.

**Features:**
- Clean house silhouette
- Roof, body, windows, door details
- Chimney element
- Layered opacity for depth

**Usage:**
```tsx
import { HeaderIcon } from '@/components/Icons';

<HeaderIcon
  size={64}
  color="#ffffff"
/>
```

**Props:**
- `size?: number` - Icon size in pixels (default: 64)
- `className?: string` - Additional CSS classes
- `color?: string` - Icon color (default: '#ffffff')

**Design:**
- Triangular roof
- Rectangular house body
- Two windows and centered door
- Chimney on the right side
- Door handle detail
- Works well at 48-96px sizes

---

## Implementation

Both icons are implemented as React functional components with:
- Proper TypeScript typing
- Accessible ARIA labels
- Scalable SVG format
- Configurable size and color
- Clean, geometric design

## Theme Integration

**LogoIcon** in MainLayout:
- Light theme: `#059669` (green-600)
- Dark theme: `#10b981` (green-500)

**HeaderIcon** in Dashboard:
- Always white (`#ffffff`) on gradient background

## Design Principles

1. **Geometric** - Clean lines and simple shapes
2. **Minimalist** - No unnecessary details
3. **Scalable** - Works at any size
4. **Professional** - Modern, business-appropriate
5. **Accessible** - Proper ARIA labels and semantic markup
6. **Theme-aware** - Adapts to light/dark themes
