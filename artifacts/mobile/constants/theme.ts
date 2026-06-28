export const theme = {
  gradients: {
    primary: ["#4A9FFF", "#2B6FDF"] as const,
    primaryReverse: ["#2B6FDF", "#4A9FFF"] as const,
    secondary: ["#B45EFF", "#7B2FFF"] as const,
    secondaryReverse: ["#7B2FFF", "#B45EFF"] as const,
    danger: ["#EF5555", "#DC2626"] as const,
    gold: ["#FFE066", "#FFB347"] as const,
    accent: ["#00F5FF", "#0099CC"] as const,
    disabled: ["#2A2640", "#1C1A2E"] as const,
    skyLayer1: ["#08061A", "#110A2E", "#1A0D3D", "#0F1847"] as const,
    skyLayer2: ["#0D0B25", "#16103A", "#100D30"] as const,
    fogOverlay: ["rgba(120,80,255,0.0)", "rgba(60,30,180,0.12)", "rgba(120,80,255,0.0)"] as const,
    cardSheen: ["rgba(160,120,255,0.07)", "rgba(255,255,255,0.0)"] as const,
  },

  glows: {
    primary: { color: "#3B8FFF", opacity: 0.5, radius: 14 },
    secondary: { color: "#9B4BFF", opacity: 0.5, radius: 14 },
    accent: { color: "#00E5FF", opacity: 0.55, radius: 16 },
    gold: { color: "#FFB347", opacity: 0.65, radius: 10 },
    success: { color: "#10B981", opacity: 0.45, radius: 10 },
    danger: { color: "#DC2626", opacity: 0.55, radius: 10 },
    tab: { color: "#3B8FFF", opacity: 0.8, radius: 12 },
  },

  shadows: {
    card: {
      shadowColor: "#9B4BFF",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 6,
    },
    cardStrong: {
      shadowColor: "#3B8FFF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 18,
      elevation: 10,
    },
    button: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 14,
      elevation: 8,
    },
    tab: {
      shadowColor: "#9B4BFF",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
    },
    glow: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  animation: {
    fast: 150,
    normal: 250,
    slow: 450,
    drift: 22000,
    particleMin: 5000,
    particleMax: 12000,
    springFast: { tension: 80, friction: 10 },
    springNormal: { tension: 55, friction: 9 },
    springBouncy: { tension: 65, friction: 7 },
  },

  particles: {
    count: 14,
    types: [
      { color: "rgba(255,110,50,0.85)", size: 3, name: "ember" },
      { color: "rgba(59,143,255,0.9)", size: 2, name: "spark" },
      { color: "rgba(180,255,60,0.75)", size: 2.5, name: "firefly" },
      { color: "rgba(255,215,0,0.7)", size: 2, name: "mote" },
      { color: "rgba(0,229,255,0.8)", size: 1.5, name: "dust" },
    ],
  },

  silhouette: {
    dark: "#040310",
    mid: "#070520",
    fog: "rgba(80,40,180,0.08)",
  },
};

export type ThemeGradient = keyof typeof theme.gradients;
export type ThemeGlow = keyof typeof theme.glows;
