# 🎨 Color System Documentation

## Overview

Your ACT prep app now has a **centralized color system** that makes it easy to try different color schemes without changing hardcoded values throughout the codebase.

## How It Works

### CSS Custom Properties

All colors are defined as CSS custom properties (variables) in `src/index.css`:

```css
:root {
  --color-primary: #a855f7; /* Main brand color */
  --color-accent: #facc15; /* Main accent color */
  --color-bg-primary: #a855f7; /* Main background */
  /* ... and many more */
}
```

### Pre-built Color Schemes

9 different color schemes are available in `src/lib/colorSchemes.ts`:

1. **Original Purple + Vanilla** (Default) - Classic, warm
2. **Purple + Vanilla (Refined)** - Professional, friendly
3. **Blue + Orange** - Professional, trustworthy
4. **Green + Yellow** - Nature, growth
5. **Purple + Pink** - Creative, modern
6. **Teal + Coral** - Modern, fresh
7. **Indigo + Amber** - Corporate, reliable
8. **Rose + Lime** - Playful, energetic
9. **Slate + Gold** - Elegant, sophisticated

## How to Change Colors

### Option 1: Use the Settings Page (Easiest)

1. Go to **Settings** page in your app
2. Click on **"Color Theme"** dropdown
3. Select any of the 9 pre-built schemes
4. Colors change instantly across the entire app!

### Option 2: Modify CSS Variables (Advanced)

Edit the variables in `src/index.css`:

```css
:root {
  --color-primary: #your-color-here;
  --color-accent: #your-accent-here;
  /* ... */
}
```

### Option 3: Add New Color Schemes (Developer)

Add new schemes to `src/lib/colorSchemes.ts`:

```typescript
export const colorSchemes = {
  // ... existing schemes
  myNewScheme: {
    "--color-primary": "#your-color",
    "--color-accent": "#your-accent",
    // ... other properties
  },
};
```

## Color Variables Available

### Primary Colors

- `--color-primary` - Main brand color
- `--color-primary-light` - Lighter version
- `--color-primary-dark` - Darker version

### Accent Colors

- `--color-accent` - Main accent color
- `--color-accent-light` - Lighter version
- `--color-accent-dark` - Darker version

### Background Colors

- `--color-bg-primary` - Main background
- `--color-bg-secondary` - Secondary background
- `--color-bg-card` - Card background
- `--color-bg-card-hover` - Card hover state

### Text Colors

- `--color-text-primary` - Main text
- `--color-text-secondary` - Secondary text
- `--color-text-muted` - Muted text
- `--color-text-dark` - Dark text (for light backgrounds)

### Status Colors

- `--color-success` - Success green
- `--color-warning` - Warning orange
- `--color-error` - Error red
- `--color-info` - Info blue

### Gradients

- `--gradient-primary` - Primary gradient
- `--gradient-accent` - Accent gradient
- `--gradient-card` - Card gradient

## Benefits

✅ **Easy experimentation** - Try 9 different schemes instantly
✅ **Consistent colors** - All components use the same variables
✅ **No hardcoded values** - Change colors in one place
✅ **Professional look** - Each scheme is carefully designed
✅ **User preference** - Users can choose their favorite theme
✅ **Future-proof** - Easy to add new schemes

## Tips for Creating New Schemes

1. **Choose complementary colors** - Primary and accent should work well together
2. **Consider accessibility** - Ensure good contrast ratios
3. **Test on all components** - Make sure it looks good everywhere
4. **Keep it cohesive** - All colors should feel like they belong together
5. **Think about mood** - Different colors create different feelings

## Example: Creating a Custom Scheme

```typescript
// In src/lib/colorSchemes.ts
customScheme: {
  '--color-primary': '#6366f1',      // Indigo
  '--color-primary-light': '#818cf8',
  '--color-primary-dark': '#4f46e5',
  '--color-accent': '#f59e0b',       // Amber
  '--color-accent-light': '#fbbf24',
  '--color-accent-dark': '#d97706',
  '--color-bg-primary': '#6366f1',
  '--color-bg-secondary': '#4f46e5',
}
```

Then apply it:

```typescript
import { applyColorScheme } from "./lib/colorSchemes";
applyColorScheme("customScheme");
```

That's it! Your entire app will instantly use the new color scheme. 🎨
