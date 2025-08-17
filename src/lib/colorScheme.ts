// Polished Purple + Vanilla Color Scheme
// This file defines a cohesive color palette based on your existing purple + vanilla theme

export const colorScheme = {
  // Primary Purple Palette (refined)
  purple: {
    50: '#faf5ff',    // Very light purple
    100: '#f3e8ff',   // Light purple
    200: '#e9d5ff',   // Soft purple
    300: '#d8b4fe',   // Medium light purple
    400: '#c084fc',   // Medium purple
    500: '#a855f7',   // Primary purple
    600: '#9333ea',   // Dark purple
    700: '#7c3aed',   // Deep purple
    800: '#6b21a8',   // Very dark purple
    900: '#581c87',   // Darkest purple
  },
  
  // Vanilla/Cream Palette (refined)
  vanilla: {
    50: '#fefce8',    // Very light vanilla
    100: '#fef9c3',   // Light vanilla
    200: '#fef08a',   // Soft vanilla
    300: '#fde047',   // Medium vanilla
    400: '#facc15',   // Primary vanilla
    500: '#eab308',   // Rich vanilla
    600: '#ca8a04',   // Dark vanilla
    700: '#a16207',   // Deep vanilla
    800: '#854d0e',   // Very dark vanilla
    900: '#713f12',   // Darkest vanilla
  },
  
  // Gradient Combinations
  gradients: {
    primary: 'from-purple-500 to-purple-700',
    secondary: 'from-vanilla-400 to-vanilla-600',
    hero: 'from-purple-400 via-purple-500 to-purple-600',
    card: 'from-purple-50 to-vanilla-50',
    button: 'from-purple-500 to-purple-600',
    accent: 'from-vanilla-400 to-vanilla-500',
  },
  
  // Background Colors
  backgrounds: {
    primary: '#ffffff',
    secondary: '#faf5ff',    // Very light purple
    tertiary: '#fefce8',     // Very light vanilla
    card: '#ffffff',
    cardHover: '#faf5ff',
  },
  
  // Text Colors
  text: {
    primary: '#1f2937',      // Dark gray
    secondary: '#6b7280',    // Medium gray
    accent: '#a855f7',       // Purple
    light: '#9ca3af',        // Light gray
  },
  
  // Border Colors
  borders: {
    primary: '#e5e7eb',
    secondary: '#e9d5ff',    // Light purple
    accent: '#fde047',       // Vanilla
  }
}

// CSS Custom Properties for easy use
export const cssVariables = `
  :root {
    --color-purple-50: ${colorScheme.purple[50]};
    --color-purple-100: ${colorScheme.purple[100]};
    --color-purple-200: ${colorScheme.purple[200]};
    --color-purple-300: ${colorScheme.purple[300]};
    --color-purple-400: ${colorScheme.purple[400]};
    --color-purple-500: ${colorScheme.purple[500]};
    --color-purple-600: ${colorScheme.purple[600]};
    --color-purple-700: ${colorScheme.purple[700]};
    --color-purple-800: ${colorScheme.purple[800]};
    --color-purple-900: ${colorScheme.purple[900]};
    
    --color-vanilla-50: ${colorScheme.vanilla[50]};
    --color-vanilla-100: ${colorScheme.vanilla[100]};
    --color-vanilla-200: ${colorScheme.vanilla[200]};
    --color-vanilla-300: ${colorScheme.vanilla[300]};
    --color-vanilla-400: ${colorScheme.vanilla[400]};
    --color-vanilla-500: ${colorScheme.vanilla[500]};
    --color-vanilla-600: ${colorScheme.vanilla[600]};
    --color-vanilla-700: ${colorScheme.vanilla[700]};
    --color-vanilla-800: ${colorScheme.vanilla[800]};
    --color-vanilla-900: ${colorScheme.vanilla[900]};
  }
`
