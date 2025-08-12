// Modern Color Scheme for TestPrep Pro
// Generated with inspiration from Coolors.co

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Secondary Colors
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef', // Main secondary
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  
  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Accent Colors
  accent: {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#10b981',
    orange: '#f97316',
    pink: '#ec4899',
    teal: '#14b8a6',
    indigo: '#6366f1',
    yellow: '#eab308',
  }
}

// Gradient combinations
export const gradients = {
      primary: 'from-emerald-500 to-teal-600',
    secondary: 'from-teal-500 to-cyan-600',
  success: 'from-green-500 to-teal-600',
  warning: 'from-yellow-500 to-orange-600',
  error: 'from-red-500 to-pink-600',
  cool: 'from-cyan-500 to-emerald-600',
  warm: 'from-orange-500 to-red-600',
  modern: 'from-emerald-500 to-teal-600',
  sunset: 'from-pink-500 to-orange-600',
  ocean: 'from-emerald-500 to-cyan-600',
}

// Theme configuration
export const theme = {
  light: {
    background: colors.neutral[50],
    surface: colors.neutral[100],
    text: colors.neutral[900],
    textSecondary: colors.neutral[600],
    border: colors.neutral[200],
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  dark: {
    background: colors.neutral[900],
    surface: colors.neutral[800],
    text: colors.neutral[100],
    textSecondary: colors.neutral[400],
    border: colors.neutral[700],
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
  }
}
