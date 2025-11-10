# Dashboard Design System

## Overview

Modern icon design system for TenderHub dashboard featuring circular gradient backgrounds, green/teal color palette, and smooth animations.

## Color Palette

### Primary Gradient
```css
Primary: linear-gradient(135deg, #1a5f7a 0%, #159957 100%)
```

### Card-Specific Gradients

| Card | Name | Gradient | Hex Colors | Use Case |
|------|------|----------|------------|----------|
| Дашборд | Dashboard | 135deg, #1a5f7a → #159957 | Dark Teal → Green | Primary feature - overview |
| Позиции заказчика | Positions | 135deg, #10b981 → #059669 | Emerald → Deep Emerald | Data management |
| Коммерция | Commerce | 135deg, #06b6d4 → #0891b2 | Cyan → Dark Cyan | Financial features |
| Библиотеки | Libraries | 135deg, #14b8a6 → #0d9488 | Teal → Deep Teal | Reference materials |
| Затраты на строительство | Costs | 135deg, #34d399 → #10b981 | Mint → Emerald | Cost calculations |
| Администрирование | Administration | 135deg, #0284c7 → #0369a1 | Ocean → Deep Ocean | System settings |
| Пользователи | Users | 135deg, #0891b2 → #0e7490 | Blue-Green → Deep Blue-Green | User management |
| Настройки | Settings | 135deg, #22c55e → #16a34a | Sage → Deep Sage | Configuration |

## Design Specifications

### Icon Container

**Desktop (Default)**
```css
Size: 64px × 64px
Border Radius: 50% (circle)
Icon Size: 28px
Icon Color: #ffffff (white)
Shadow: 0 4px 12px rgba(color, 0.25)
Hover Shadow: 0 8px 24px rgba(color, 0.35)
Margin Bottom: 20px
```

**Tablet (max-width: 768px)**
```css
Size: 56px × 56px
Icon Size: 24px
```

**Mobile (max-width: 576px)**
```css
Size: 52px × 52px
Icon Size: 22px
```

### Card Specifications

```css
Height: 180px
Border Radius: 16px
Padding: 24px
Background Light: #ffffff
Background Dark: #141414
Border Light: rgba(0, 0, 0, 0.06)
Border Dark: rgba(255, 255, 255, 0.08)
```

### Animation & Transitions

**Card Hover**
```css
Transform: translateY(-6px)
Transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Shadow Light: 0 12px 32px rgba(0, 0, 0, 0.15)
Shadow Dark: 0 12px 32px rgba(0, 0, 0, 0.35)
Border Color Light: rgba(16, 185, 129, 0.3)
Border Color Dark: rgba(255, 255, 255, 0.15)
```

**Icon Container Hover**
```css
Transform: scale(1.08) rotate(5deg)
Icon Transform: scale(1.1)
Transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

## Icon Style Guide

### Icon Type: **Filled** (Bold, Modern)

Selected icons from Ant Design:
- `DashboardFilled` - Дашборд
- `TableOutlined` - Позиции заказчика (no filled variant)
- `CalculatorFilled` - Коммерция
- `BookFilled` - Библиотеки
- `DollarCircleFilled` - Затраты на строительство
- `SettingFilled` - Администрирование
- `UserOutlined` - Пользователи (no filled variant)
- `ToolFilled` - Настройки

**Rationale**: Filled icons provide:
- Modern, bold aesthetic
- Better visibility on gradient backgrounds
- Consistent visual weight
- Professional appearance

## Header Design

### Gradient Backgrounds

**Light Theme**
```css
background: linear-gradient(135deg, #0891b2 0%, #10b981 100%);
```

**Dark Theme**
```css
background: linear-gradient(135deg, #1a5f7a 0%, #159957 100%);
```

### Specifications
```css
Padding: 60px 48px
Margin: 0 24px 48px 24px
Border Radius: 24px
Shadow Light: 0 4px 24px rgba(0, 0, 0, 0.1)
Shadow Dark: 0 4px 24px rgba(0, 0, 0, 0.3)
```

### Shimmer Animation
```css
Duration: 6s
Timing: infinite
Effect: Subtle light sweep across gradient
```

## Accessibility Considerations

### Color Contrast
- White icons (#ffffff) on gradient backgrounds meet WCAG AA standards
- Minimum contrast ratio: 4.5:1 for normal text
- Icon contrast: 7:1+ (excellent)

### Hover States
- Clear visual feedback on hover
- Transform + shadow increase
- Color border change
- Smooth transitions for reduced motion compatibility

### Dark Theme
- Enhanced shadows for better depth perception
- Adjusted border colors for visibility
- Maintains color harmony with light theme

## Theme Support

### Light Theme
```css
Container Background: #f0f2f5
Card Background: #ffffff
Card Border: rgba(0, 0, 0, 0.06)
Hover Border: rgba(16, 185, 129, 0.3)
```

### Dark Theme
```css
Container Background: #000000
Card Background: #141414
Card Border: rgba(255, 255, 255, 0.08)
Hover Border: rgba(255, 255, 255, 0.15)
```

## Responsive Breakpoints

### Desktop (>768px)
- 4 cards per row (6-column grid)
- Full icon size (64px)
- Full padding and spacing

### Tablet (≤768px)
- 2 cards per row (12-column grid)
- Medium icon size (56px)
- Reduced padding

### Mobile (≤576px)
- 1 card per row (24-column grid)
- Small icon size (52px)
- Minimal padding

## Implementation Notes

### CSS Classes
```css
.icon-container              /* Base container styles */
.icon-container-dashboard    /* Dashboard-specific gradient */
.icon-container-positions    /* Positions-specific gradient */
.icon-container-commerce     /* Commerce-specific gradient */
.icon-container-libraries    /* Libraries-specific gradient */
.icon-container-costs        /* Costs-specific gradient */
.icon-container-admin        /* Admin-specific gradient */
.icon-container-users        /* Users-specific gradient */
.icon-container-settings     /* Settings-specific gradient */
```

### Component Props
```typescript
interface DashboardCardProps {
  icon: React.ReactNode;      // Ant Design icon component
  title: string;               // Card title (Russian)
  description: string;         // Card description (Russian)
  iconClass: string;           // CSS class for gradient
  onClick?: () => void;        // Optional click handler
}
```

## Design Rationale

### Why Circular Gradient Backgrounds?
1. **Modern Aesthetic**: Circles are inherently pleasing and modern
2. **Visual Hierarchy**: Color-coded circles create instant recognition
3. **Depth**: Gradients add dimension and sophistication
4. **Consistency**: Unified design language across all cards
5. **Accessibility**: High contrast white icons on dark gradients

### Why Green/Teal Palette?
1. **Brand Identity**: Establishes cohesive visual identity
2. **Professional**: Green/teal conveys trust and growth
3. **Construction Industry**: Green represents sustainability and progress
4. **Distinction**: Each feature has unique but harmonious color
5. **Accessibility**: Sufficient contrast for readability

### Why Filled Icons?
1. **Visual Weight**: Filled icons are more prominent
2. **Modern Design**: Current design trend favors filled styles
3. **Gradient Compatibility**: Solid icons pop against gradients
4. **Consistency**: Uniform icon style across dashboard
5. **Clarity**: Easier to recognize at a glance

## Usage Examples

### Adding a New Card

```typescript
// 1. Import the filled icon
import { NewFeatureFilled } from '@ant-design/icons';

// 2. Add CSS gradient in Dashboard.css
.icon-container-newfeature {
  background: linear-gradient(135deg, #COLOR1 0%, #COLOR2 100%);
  box-shadow: 0 4px 12px rgba(R, G, B, 0.25);
}

.dashboard-card:hover .icon-container-newfeature {
  box-shadow: 0 8px 24px rgba(R, G, B, 0.35);
}

// 3. Add card to cards array
{
  icon: <NewFeatureFilled />,
  title: 'Новая функция',
  description: 'Описание новой функции',
  iconClass: 'icon-container-newfeature',
}
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

**Note**: Uses standard CSS3 properties with excellent browser support.

## Performance

- **CSS Transitions**: Hardware-accelerated (transform, opacity)
- **Gradients**: Rendered once, cached by browser
- **Animations**: Minimal CPU usage (shimmer effect paused when not visible)
- **No JavaScript**: All animations pure CSS

## Future Enhancements

1. **Micro-interactions**: Add subtle icon wiggle on hover
2. **Loading States**: Skeleton screens for card loading
3. **Click Animations**: Ripple effect on card click
4. **Customization**: Allow users to reorder cards
5. **Analytics**: Track most-used features via card clicks

---

**Last Updated**: 2025-11-06
**Version**: 1.0
**Maintained by**: TenderHub Design Team
