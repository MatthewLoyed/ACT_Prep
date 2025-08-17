// Color Scheme Presets
// Change these variables in src/index.css to try different color schemes

export const colorSchemes = {
  // Original Purple + Vanilla (from backup)
  originalPurpleVanilla: {
    '--color-primary': '#667eea',
    '--color-primary-light': '#7c3aed',
    '--color-primary-dark': '#5b21b6',
    '--color-accent': '#ffeaa7',
    '--color-accent-light': '#fef08a',
    '--color-accent-dark': '#fdcb6e',
    '--color-accent-rgb': '255, 234, 167',
    '--color-accent-dark-rgb': '253, 203, 110',
    '--color-bg-primary': '#667eea',
    '--color-bg-secondary': '#764ba2',
    '--logo-filter': 'hue-rotate(0deg) saturate(0.8) brightness(1.1)',
  },

  // Current Purple + Vanilla (refined)
  purpleVanilla: {
    '--color-primary': '#a855f7',
    '--color-primary-light': '#c084fc',
    '--color-primary-dark': '#7c3aed',
    '--color-accent': '#facc15',
    '--color-accent-light': '#fde047',
    '--color-accent-dark': '#eab308',
    '--color-accent-rgb': '250, 204, 21',
    '--color-accent-dark-rgb': '234, 179, 8',
    '--color-bg-primary': '#a855f7',
    '--color-bg-secondary': '#7c3aed',
    '--logo-filter': 'hue-rotate(0deg) saturate(1.2) brightness(1.0)',
  },

  // Blue + Orange (Professional)
  blueOrange: {
    '--color-primary': '#3b82f6',
    '--color-primary-light': '#60a5fa',
    '--color-primary-dark': '#2563eb',
    '--color-accent': '#f97316',
    '--color-accent-light': '#fb923c',
    '--color-accent-dark': '#ea580c',
    '--color-accent-rgb': '249, 115, 22',
    '--color-accent-dark-rgb': '234, 88, 12',
    '--color-bg-primary': '#3b82f6',
    '--color-bg-secondary': '#2563eb',
    '--logo-filter': 'hue-rotate(25deg) saturate(1.3) brightness(1.1)',
  },

  // Green + Yellow (Nature)
  greenYellow: {
    '--color-primary': '#10b981',
    '--color-primary-light': '#34d399',
    '--color-primary-dark': '#059669',
    '--color-accent': '#fbbf24',
    '--color-accent-light': '#fcd34d',
    '--color-accent-dark': '#f59e0b',
    '--color-bg-primary': '#10b981',
    '--color-bg-secondary': '#059669',
    '--logo-filter': 'hue-rotate(0deg) saturate(1.1) brightness(1.0)',
  },

  // Purple + Pink (Creative)
  purplePink: {
    '--color-primary': '#8b5cf6',
    '--color-primary-light': '#a78bfa',
    '--color-primary-dark': '#7c3aed',
    '--color-accent': '#ec4899',
    '--color-accent-light': '#f472b6',
    '--color-accent-dark': '#db2777',
    '--color-bg-primary': '#8b5cf6',
    '--color-bg-secondary': '#7c3aed',
    '--logo-filter': 'hue-rotate(320deg) saturate(1.4) brightness(1.0)',
  },

  // Teal + Coral (Modern)
  tealCoral: {
    '--color-primary': '#14b8a6',
    '--color-primary-light': '#2dd4bf',
    '--color-primary-dark': '#0d9488',
    '--color-accent': '#f97316',
    '--color-accent-light': '#fb923c',
    '--color-accent-dark': '#ea580c',
    '--color-bg-primary': '#14b8a6',
    '--color-bg-secondary': '#0d9488',
    '--logo-filter': 'hue-rotate(25deg) saturate(1.3) brightness(1.1)',
  },

  // Indigo + Amber (Corporate)
  indigoAmber: {
    '--color-primary': '#6366f1',
    '--color-primary-light': '#818cf8',
    '--color-primary-dark': '#4f46e5',
    '--color-accent': '#f59e0b',
    '--color-accent-light': '#fbbf24',
    '--color-accent-dark': '#d97706',
    '--color-bg-primary': '#6366f1',
    '--color-bg-secondary': '#4f46e5',
  },

  // Rose + Lime (Playful)
  roseLime: {
    '--color-primary': '#f43f5e',
    '--color-primary-light': '#fb7185',
    '--color-primary-dark': '#e11d48',
    '--color-accent': '#84cc16',
    '--color-accent-light': '#a3e635',
    '--color-accent-dark': '#65a30d',
    '--color-bg-primary': '#f43f5e',
    '--color-bg-secondary': '#e11d48',
  },

  // Slate + Gold (Elegant)
  slateGold: {
    '--color-primary': '#475569',
    '--color-primary-light': '#64748b',
    '--color-primary-dark': '#334155',
    '--color-accent': '#fbbf24',
    '--color-accent-light': '#fcd34d',
    '--color-accent-dark': '#f59e0b',
    '--color-bg-primary': '#475569',
    '--color-bg-secondary': '#334155',
  }
}

// Function to apply a color scheme
export function applyColorScheme(schemeName: keyof typeof colorSchemes) {
  const scheme = colorSchemes[schemeName]
  const root = document.documentElement
  
  Object.entries(scheme).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })
  
  // Update gradients
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${scheme['--color-primary']} 0%, ${scheme['--color-primary-dark']} 100%)`)
  root.style.setProperty('--gradient-accent', `linear-gradient(45deg, ${scheme['--color-accent']} 0%, ${scheme['--color-accent-dark']} 100%)`)
  root.style.setProperty('--gradient-card', `linear-gradient(135deg, ${scheme['--color-primary-light']} 0%, ${scheme['--color-accent-light']} 100%)`)
  
  // Update shadow colors
  const accentRgb = hexToRgb(scheme['--color-accent'])
  if (accentRgb) {
    root.style.setProperty('--shadow-color-accent', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.5)`)
  }
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Function to get current color scheme
export function getCurrentColorScheme(): keyof typeof colorSchemes {
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
  
  for (const [name, scheme] of Object.entries(colorSchemes)) {
    if (scheme['--color-primary'] === primary) {
      return name as keyof typeof colorSchemes
    }
  }
  
  return 'originalPurpleVanilla' // Default
}
