# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TenderHub is a construction tender management portal built with React 18, TypeScript 5.8, and Vite 7. The application manages hierarchical Bill of Quantities (BOQ), materials/works libraries, and tender workflows for construction project bidding.

**Language**: Russian UI throughout
**React Version**: React 18.3.1 (stable, compatible with Ant Design 5)
**Authentication**: Enabled with 5-role system (Administrator, moderator, engineer, manager, director)

## Development Commands

```bash
# Core development
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173, auto-assigns port if busy)
npm run build        # Production build (Vite only, NO TypeScript checking for faster builds)
npm run build:check  # Production build WITH TypeScript type checking (use for validation)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint checks (flat config)

# Database management
npm run db:schema    # Export production schema to supabase/schemas/prod.sql

# Testing (Playwright)
npm run test         # Run all Playwright tests
npm run test:ui      # Run tests with Playwright UI
npm run test:headed  # Run tests in headed mode (visible browser)
npm run test:debug   # Run tests in debug mode

# Database verification scripts
node src/scripts/checkPositionTotals.ts           # Verify position totals match calculated values
node src/scripts/applyPositionTotalsTrigger.ts    # Apply position totals trigger migration
node src/scripts/updateCommercialCostsFunction.ts # Update commercial costs function
node src/scripts/recalculatePositionTotals.ts [tenderId]  # Force recalculate position totals (optional tender ID)
npx tsx src/scripts/updateDefaultMarkupPercentages.ts     # Update existing markup percentages to new defaults
npx tsx src/scripts/recalculateCommercialCosts.ts        # Recalculate commercial costs with correct formulas
npx tsx src/scripts/fixCommercialCosts.ts                # Fix astronomical commercial costs in database
npx tsx src/scripts/checkPosition8.ts                    # Check position 8 calculation details

# Deployment
vercel --prod        # Deploy to production (requires VERCEL_TOKEN env var or login)
```

## Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.8.3, Vite 7.0.4
- **UI**: Ant Design 5.26.7 (no patch needed for React 18)
- **State**: TanStack Query 5.84.1 (5-minute cache, no window refetch)
- **Database**: Supabase 2.53.0 (PostgreSQL 16, RLS disabled)
- **Styling**: Tailwind CSS 3.4.17 (preflight disabled for Ant Design)
- **Excel**: xlsx-js-style 1.2.0 for styled import/export
- **Drag & Drop**: @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0
- **Virtual Scrolling**: react-window 1.8.11 + react-window-infinite-loader
- **Forms**: react-hook-form 7.62.0 + yup 1.7.0 validation
- **Routing**: react-router-dom 7.7.1
- **Testing**: Playwright 1.56.0 (E2E testing, port 5174)
- **Deployment**: Vercel (production deployment platform)

## MCP (Model Context Protocol) Integration

**Supabase MCP Server** configured for direct database access:
- Available tools: `mcp__supabase__*` (query, insert, update, delete, rpc, schema)
- Check connection: `/mcp list`

**GitHub MCP Server** configured for repository operations:
- Available tools: `mcp__github__*`

## 🚨 CRITICAL DATABASE RULE 🚨

```
ALL database operations MUST reference:
supabase/schemas/prod.sql

This is the SINGLE SOURCE OF TRUTH for:
- Tables, columns, types
- Functions and procedures
- Views and triggers
- ENUMs and indexes

NEVER trust TypeScript types over prod.sql
ALWAYS verify schema before ANY database work
```

## 📋 Coding Principles & Constraints

### File Size Limits
- **STRICT RULE**: Every code file MUST be ≤ 600 lines
- If a file exceeds 600 lines, split it into smaller modules
- Extract complex logic into separate utility files
- Use barrel exports (index.ts) to organize module exports

### Code Organization
- **Single Responsibility**: Each file should have ONE clear purpose
- **Component Structure**:
  - Container components: Business logic and data fetching
  - Presentational components: UI rendering only
  - Hooks: Reusable stateful logic
  - Utils: Pure functions and helpers

### TypeScript Guidelines
- **Type Safety**: Never use `any` without explicit justification
- **Interface over Type**: Use interfaces for object shapes, types for unions/primitives
- **Explicit Return Types**: Always declare function return types
- **Null Safety**: Use optional chaining (?.) and nullish coalescing (??)

### React Best Practices
- **Functional Components**: Use hooks, no class components
- **Memoization**: Use React.memo, useMemo, useCallback for expensive operations
- **Key Prop**: Always use stable, unique keys in lists
- **State Management**:
  - Local state for component-specific data
  - TanStack Query for server state
  - Context API for cross-cutting concerns

### Theme Requirements
- **Dual Theme Support**: Application MUST support both light and dark themes
- **Theme Switching**: Users should be able to toggle between themes
- **Consistent Theming**: When implementing any UI changes, ensure compatibility with BOTH themes
- **Theme Implementation**:
  - Use Ant Design's ConfigProvider with theme algorithms
  - Store theme preference in localStorage (key: `tenderHub_theme`)
  - Apply theme-specific colors via CSS variables or Ant Design tokens
  - Test all components in both light and dark modes
- **Color Scheme**:
  - **Dark Theme**:
    - Background: `#000000` (pure black)
    - Sidebar: `#0a0a0a`
    - Cards: `#141414`
    - Borders: `rgba(255, 255, 255, 0.08)`
    - Text: `#ffffff` / `rgba(255, 255, 255, 0.85)`
  - **Light Theme**:
    - Background: `#f0f2f5`
    - Sidebar: `#ffffff`
    - Cards: default Ant Design
    - Borders: `rgba(0, 0, 0, 0.06)`
    - Text: default Ant Design
  - **Header Gradients** (green/teal color scheme):
    - Light: `linear-gradient(135deg, #0891b2 0%, #10b981 100%)` (cyan to emerald)
    - Dark: `linear-gradient(135deg, #1a5f7a 0%, #159957 100%)` (dark teal to green)
    - Border radius: `24px` for modern rounded corners
    - Box shadow for depth perception
  - **Icon Design System**:
    - Circular containers: 64px × 64px
    - Icon size: 28px (white color)
    - Filled icons for modern look
    - Gradient backgrounds per feature:
      1. Dashboard: `#1a5f7a → #159957`
      2. Positions: `#10b981 → #059669`
      3. Commerce: `#06b6d4 → #0891b2`
      4. Libraries: `#14b8a6 → #0d9488`
      5. Costs: `#34d399 → #10b981`
      6. Administration: `#0284c7 → #0369a1`
      7. Users: `#0891b2 → #0e7490`
      8. Settings: `#22c55e → #16a34a`
- **Design Pattern**: Headers with gradient backgrounds and rounded corners, content on solid backgrounds
- **Accessibility**: Ensure sufficient contrast ratios in both themes (WCAG AA standard minimum)

### Database Operations
- **Always check prod.sql** before any database operation
- **Use RPC functions** for complex queries (defined in prod.sql)
- **Transaction Safety**: Wrap related operations in transactions
- **Error Handling**: Always handle database errors gracefully

### Performance Rules
- **Virtual Scrolling**: Use react-window for lists > 100 items
- **Lazy Loading**: Split code for routes and heavy components
- **Image Optimization**: Use appropriate formats and sizes
- **Debounce/Throttle**: For search inputs and scroll handlers

### Testing Requirements
- **E2E Tests**: Critical user flows must have Playwright tests
- **Unit Tests**: Utility functions and complex logic
- **Integration Tests**: API endpoints and database operations

### Code Quality
- **DRY Principle**: Don't Repeat Yourself - extract common logic
- **KISS Principle**: Keep It Simple, Stupid - avoid over-engineering
- **Comments**: Document WHY, not WHAT
- **Naming**: Use clear, descriptive names (no abbreviations)

### Russian UI Convention
- All user-facing text MUST be in Russian
- Use semantic naming for variables (English)
- Comments can be in English or Russian

### Git Conventions
- **Commit Messages**: Clear, descriptive messages in imperative mood
- **Branch Naming**: feature/, fix/, refactor/ prefixes
- **Pull Requests**: Must include description and testing steps

### Security Practices
- **No Secrets**: Never commit API keys or passwords
- **Input Validation**: Validate all user inputs (client AND server)
- **SQL Injection**: Use parameterized queries only
- **XSS Prevention**: Sanitize user-generated content

### Error Handling
- **User-Friendly Messages**: Show helpful error messages in Russian
- **Logging**: Log errors with context for debugging
- **Fallbacks**: Provide graceful degradation for failures

### Deployment Checklist
- ✅ TypeScript build passes (`npm run build:check`)
- ✅ ESLint passes (`npm run lint`)
- ✅ Tests pass (`npm run test`)
- ✅ Database migrations applied
- ✅ Environment variables configured

