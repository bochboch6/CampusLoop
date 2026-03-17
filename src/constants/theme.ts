// ── Nature-inspired palette ───────────────────────────────────────────────────
export const C = {
  deepGreen:  '#1B4332',
  leafGreen:  '#52B788',
  mintGreen:  '#95D5B2',
  skyBlue:    '#90E0EF',
  earthBrown: '#8B5E3C',
  cream:      '#F8F4E3',
  lightCream: '#FDFAF4',
  darkText:   '#1A1A1A',
  mutedText:  '#6B7280',
  errorRed:   '#DC2626',
  warningAmber: '#D97706',
  white:      '#FFFFFF',
} as const;

// Gradient tuples ─────────────────────────────────────────────────────────────
export const G = {
  skyToForest:  [C.skyBlue,   C.leafGreen, C.deepGreen] as const,
  forestToSky:  [C.deepGreen, C.leafGreen, C.skyBlue  ] as const,
  forestToMint: [C.deepGreen, C.leafGreen, C.mintGreen] as const,
  leafToMint:   [C.leafGreen, C.mintGreen             ] as const,
  card:         [C.leafGreen, C.deepGreen             ] as const,
} as const;

// Shared shadow ───────────────────────────────────────────────────────────────
export const shadow = {
  soft: {
    shadowColor: '#1B4332',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  medium: {
    shadowColor: '#1B4332',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  button: {
    shadowColor: '#1B4332',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
} as const;
