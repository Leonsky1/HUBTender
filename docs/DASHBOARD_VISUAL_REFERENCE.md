# Dashboard Visual Reference

## Complete Color Scheme Overview

### Card Icons and Gradients

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD CARD ICONS                     │
└─────────────────────────────────────────────────────────────┘

1. 🏠 ДАШБОРД (Dashboard)
   ╔══════════════════════════════════════════════════════════╗
   ║  Icon: DashboardFilled                                   ║
   ║  Gradient: #1a5f7a → #159957                            ║
   ║  Colors: Dark Teal → Green                              ║
   ║  Description: Обзор тендеров и основные показатели      ║
   ╚══════════════════════════════════════════════════════════╝
   CSS Class: .icon-container-dashboard
   Shadow: rgba(26, 95, 122, 0.25)

2. 📋 ПОЗИЦИИ ЗАКАЗЧИКА (Customer Positions)
   ╔══════════════════════════════════════════════════════════╗
   ║  Icon: TableOutlined                                     ║
   ║  Gradient: #10b981 → #059669                            ║
   ║  Colors: Emerald → Deep Emerald                         ║
   ║  Description: Управление позициями и BOQ                ║
   ╚══════════════════════════════════════════════════════════╝
   CSS Class: .icon-container-positions
   Shadow: rgba(16, 185, 129, 0.25)

3. 🧮 КОММЕРЦИЯ (Commerce)
   ╔══════════════════════════════════════════════════════════╗
   ║  Icon: CalculatorFilled                                  ║
   ║  Gradient: #06b6d4 → #0891b2                            ║
   ║  Colors: Cyan → Dark Cyan                               ║
   ║  Description: Коммерческие расчеты и финансовые...      ║
   ╚══════════════════════════════════════════════════════════╝
   CSS Class: .icon-container-commerce
   Shadow: rgba(6, 182, 212, 0.25)

4. 📚 БИБЛИОТЕКИ (Libraries)
   ╔══════════════════════════════════════════════════════════╗
   ║  Icon: BookFilled                                        ║
   ║  Gradient: #14b8a6 → #0d9488                            ║
   ║  Colors: Teal → Deep Teal                               ║
   ║  Description: Справочники материалов, работ и шаблонов  ║
   ╚══════════════════════════════════════════════════════════╝
   CSS Class: .icon-container-libraries
   Shadow: rgba(20, 184, 166, 0.25)

5. 💰 ЗАТРАТЫ НА СТРОИТЕЛЬСТВО (Construction Costs)
   ╔══════════════════════════════════════════════════════════╗
   ║  Icon: DollarCircleFilled                                ║
   ║  Gradient: #34d399 → #10b981                            ║
   ║  Colors: Mint → Emerald                                 ║
   ║  Description: Управление затратами и калькуляция...     ║
   ╚══════════════════════════════════════════════════════════╝
   CSS Class: .icon-container-costs
   Shadow: rgba(52, 211, 153, 0.25)

6. ⚙️ АДМИНИСТРИРОВАНИЕ (Administration)
   ╔══════════════════════════════════════════════════════════╗
   ║  Icon: SettingFilled                                     ║
   ║  Gradient: #0284c7 → #0369a1                            ║
   ║  Colors: Ocean → Deep Ocean                             ║
   ║  Description: Системные настройки и справочники         ║
   ╚══════════════════════════════════════════════════════════╝
   CSS Class: .icon-container-admin
   Shadow: rgba(2, 132, 199, 0.25)

7. 👤 ПОЛЬЗОВАТЕЛИ (Users)
   ╔══════════════════════════════════════════════════════════╗
   ║  Icon: UserOutlined                                      ║
   ║  Gradient: #0891b2 → #0e7490                            ║
   ║  Colors: Blue-Green → Deep Blue-Green                   ║
   ║  Description: Управление пользователями системы         ║
   ╚══════════════════════════════════════════════════════════╝
   CSS Class: .icon-container-users
   Shadow: rgba(8, 145, 178, 0.25)

8. 🔧 НАСТРОЙКИ (Settings)
   ╔══════════════════════════════════════════════════════════╗
   ║  Icon: ToolFilled                                        ║
   ║  Gradient: #22c55e → #16a34a                            ║
   ║  Colors: Sage → Deep Sage                               ║
   ║  Description: Настройки системы и профиля               ║
   ╚══════════════════════════════════════════════════════════╝
   CSS Class: .icon-container-settings
   Shadow: rgba(34, 197, 94, 0.25)
```

## Color Palette Swatches

### Primary Gradients (135deg)

```
Dashboard      ████████████  #1a5f7a → #159957
               Dark Teal → Green

Positions      ████████████  #10b981 → #059669
               Emerald → Deep Emerald

Commerce       ████████████  #06b6d4 → #0891b2
               Cyan → Dark Cyan

Libraries      ████████████  #14b8a6 → #0d9488
               Teal → Deep Teal

Costs          ████████████  #34d399 → #10b981
               Mint → Emerald

Administration ████████████  #0284c7 → #0369a1
               Ocean → Deep Ocean

Users          ████████████  #0891b2 → #0e7490
               Blue-Green → Deep Blue-Green

Settings       ████████████  #22c55e → #16a34a
               Sage → Deep Sage
```

## Header Gradients

### Light Theme Header
```
████████████████████████████  #0891b2 → #10b981
                              Cyan → Emerald
```

### Dark Theme Header
```
████████████████████████████  #1a5f7a → #159957
                              Dark Teal → Green
```

## Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│                       HEADER SECTION                       │
│          (Gradient Background + Shimmer Effect)            │
│                                                            │
│                   🏠 Добро пожаловать                      │
│              в TenderHub (Welcome Text)                    │
│    Система управления тендерами и строительными расчетами  │
└────────────────────────────────────────────────────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Card 1    │   Card 2    │   Card 3    │   Card 4    │
│             │             │             │             │
│   ⚪ Icon   │   ⚪ Icon   │   ⚪ Icon   │   ⚪ Icon   │
│   (64px)    │   (64px)    │   (64px)    │   (64px)    │
│             │             │             │             │
│   Дашборд   │  Позиции    │  Коммерция  │ Библиотеки  │
│  (Title)    │  (Title)    │  (Title)    │  (Title)    │
│             │             │             │             │
│ Description │ Description │ Description │ Description │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Card 5    │   Card 6    │   Card 7    │   Card 8    │
│             │             │             │             │
│   ⚪ Icon   │   ⚪ Icon   │   ⚪ Icon   │   ⚪ Icon   │
│   (64px)    │   (64px)    │   (64px)    │   (64px)    │
│             │             │             │             │
│   Затраты   │   Админ     │Пользователи │  Настройки  │
│  (Title)    │  (Title)    │  (Title)    │  (Title)    │
│             │             │             │             │
│ Description │ Description │ Description │ Description │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## Icon Container Details

```
┌──────────────────────────────────────────────────┐
│         ICON CONTAINER (64px × 64px)             │
│                                                  │
│  ╔══════════════════════════════════════╗        │
│  ║                                      ║        │
│  ║         ╔═══════════════╗            ║        │
│  ║         ║               ║            ║        │
│  ║         ║   📊 ICON     ║ 28px       ║        │
│  ║         ║  (White)      ║            ║        │
│  ║         ╚═══════════════╝            ║        │
│  ║                                      ║        │
│  ║   Circular Gradient Background       ║        │
│  ║   Border Radius: 50% (circle)        ║        │
│  ║   Shadow: 0 4px 12px rgba(...)       ║        │
│  ╚══════════════════════════════════════╝        │
│                                                  │
│  Hover Effect:                                   │
│  • Scale: 1.08                                   │
│  • Rotate: 5deg                                  │
│  • Shadow: 0 8px 24px rgba(...)                  │
│  • Icon Scale: 1.1                               │
│  • Transition: 0.3s cubic-bezier(0.4,0,0.2,1)    │
└──────────────────────────────────────────────────┘
```

## Card Hover Animation

```
NORMAL STATE:
┌─────────────────────┐
│                     │
│      ⚪ Icon        │
│                     │
│      Title          │
│   Description       │
│                     │
└─────────────────────┘
• Position: Y = 0
• Shadow: 0 8px 24px
• Border: rgba(...)

        ↓ (Hover)

HOVER STATE:
┌─────────────────────┐
│                     │
│      ⚪ Icon        │  ← Scale + Rotate
│      (animated)     │
│                     │
│      Title          │
│   Description       │
│                     │
└─────────────────────┘
• Position: Y = -6px
• Shadow: 0 12px 32px
• Border: Color highlight
• Card overlay: visible
```

## Responsive Breakpoints

### Desktop (>768px)
```
┌──────┬──────┬──────┬──────┐
│ Card │ Card │ Card │ Card │
├──────┼──────┼──────┼──────┤
│ Card │ Card │ Card │ Card │
└──────┴──────┴──────┴──────┘

• 4 cards per row
• Icon: 64px × 64px (28px icon)
• Grid: Col xs={24} sm={12} lg={6}
```

### Tablet (≤768px)
```
┌────────────┬────────────┐
│   Card     │   Card     │
├────────────┼────────────┤
│   Card     │   Card     │
├────────────┼────────────┤
│   Card     │   Card     │
├────────────┼────────────┤
│   Card     │   Card     │
└────────────┴────────────┘

• 2 cards per row
• Icon: 56px × 56px (24px icon)
```

### Mobile (≤576px)
```
┌──────────────────────┐
│        Card          │
├──────────────────────┤
│        Card          │
├──────────────────────┤
│        Card          │
├──────────────────────┤
│        Card          │
├──────────────────────┤
│        Card          │
├──────────────────────┤
│        Card          │
├──────────────────────┤
│        Card          │
├──────────────────────┤
│        Card          │
└──────────────────────┘

• 1 card per row
• Icon: 52px × 52px (22px icon)
```

## Complete CSS Class Map

```css
/* Container Classes */
.dashboard-container       /* Main container */
.dashboard-light          /* Light theme background */
.dashboard-dark           /* Dark theme background */

/* Header Classes */
.dashboard-header-section  /* Header with gradient */
.dashboard-header-content  /* Header text content */
.header-icon              /* Header emoji icon */

/* Content Classes */
.dashboard-content        /* Cards container */

/* Card Classes */
.dashboard-card           /* Individual card */

/* Icon Container Classes */
.icon-container                    /* Base icon container */
.icon-container-dashboard          /* Dashboard gradient */
.icon-container-positions          /* Positions gradient */
.icon-container-commerce           /* Commerce gradient */
.icon-container-libraries          /* Libraries gradient */
.icon-container-costs              /* Costs gradient */
.icon-container-admin              /* Admin gradient */
.icon-container-users              /* Users gradient */
.icon-container-settings           /* Settings gradient */
```

## File Structure

```
src/pages/Dashboard/
├── Dashboard.tsx          ← Component logic + card data
├── Dashboard.css          ← Complete styling system
└── index.ts              ← Barrel export

docs/
├── DASHBOARD_DESIGN_SYSTEM.md     ← Design documentation
├── DESIGN_TOKENS.md               ← CSS variables & tokens
└── DASHBOARD_VISUAL_REFERENCE.md  ← This file
```

## Quick Implementation Checklist

✅ **Completed:**
- [x] 8 circular gradient icon containers
- [x] Green/teal color palette (8 variations)
- [x] Filled icons for modern look
- [x] Smooth hover animations
- [x] Both light and dark theme support
- [x] Responsive design (3 breakpoints)
- [x] Accessibility considerations
- [x] Performance optimizations
- [x] CSS organization

🎨 **Design Features:**
- [x] Circular backgrounds (border-radius: 50%)
- [x] 135-degree linear gradients
- [x] White icons (#ffffff) for high contrast
- [x] Box shadows with rgba transparency
- [x] Scale + rotate hover effects
- [x] Cubic-bezier easing functions
- [x] Shimmer animation on header

📱 **Responsive Features:**
- [x] Desktop: 64px icons, 4 columns
- [x] Tablet: 56px icons, 2 columns
- [x] Mobile: 52px icons, 1 column
- [x] Flexible grid with gutter spacing

🌓 **Theme Support:**
- [x] Light theme: Bright colors, subtle shadows
- [x] Dark theme: Rich colors, deeper shadows
- [x] Smooth theme transitions

## Testing Recommendations

### Visual Testing
1. **Light Theme**: Verify all 8 card gradients render correctly
2. **Dark Theme**: Check enhanced shadows and borders
3. **Hover States**: Test all hover animations
4. **Responsive**: Check all 3 breakpoints

### Browser Testing
- Chrome/Edge: Full gradient + animation support
- Firefox: Verify gradient rendering
- Safari: Check cubic-bezier timing
- Mobile Safari: Test touch interactions

### Accessibility Testing
- Screen reader: Verify card descriptions
- Keyboard navigation: Tab through cards
- High contrast: Check visibility
- Color blind: Verify distinguishable gradients

### Performance Testing
- Lighthouse: Check paint metrics
- DevTools: Monitor repaints on hover
- Mobile: Verify smooth animations

---

**Last Updated**: 2025-11-06
**Version**: 1.0
**Created by**: Claude (UI/UX Design Specialist)
