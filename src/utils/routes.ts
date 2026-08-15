// ─── Encrypted Route Map — Admin ─────────────────────────────────────────────
// Real page names are never exposed in the URL.

export const ADMIN_ROUTES = {
  // ── Public ────────────────────────────────────────────────────────────────
  LOGIN:          '/h4i5j6',

  // ── Protected ─────────────────────────────────────────────────────────────
  DASHBOARD:      '/k7l8m9',
  AUCTIONS:       '/n0o1p2',
  PRODUCTS:       '/q3r4s5',
  USERS:          '/t6u7v8',
  WALLET:         '/w9x0y1',
  WINNERS:        '/z2a3b4',
  REPORTS:        '/c5d6e7',
  AUDIT:          '/i1j2k3',
  SETTINGS:       '/l4m5n6',
  PROFIT:         '/p7q8r9',
} as const;

export type AdminRouteKey = keyof typeof ADMIN_ROUTES;
