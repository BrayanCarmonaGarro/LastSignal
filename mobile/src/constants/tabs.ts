export const TAB_CONFIG = {
  dashboard: {
    iconActive: "home",
    iconInactive: "home-outline",
    label: "Base",
  },
  logbook: {
    iconActive: "book",
    iconInactive: "book-outline",
    label: "Bitácora",
  },
  resources: {
    iconActive: "cube",
    iconInactive: "cube-outline",
    label: "Recursos",
  },
  trips: {
    iconActive: "map",
    iconInactive: "map-outline",
    label: "Viajes",
  },
} as const;

export type TabKey = keyof typeof TAB_CONFIG;

export const TAB_KEYS = Object.keys(TAB_CONFIG) as TabKey[];
