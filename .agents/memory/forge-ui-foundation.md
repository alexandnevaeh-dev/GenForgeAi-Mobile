---
name: Forge UI Foundation
description: Phase 1 Metroidvania/fantasy redesign — new design tokens, shared primitives, custom tab bar. All in components/ui/.
---

## Rule
All shared fantasy UI primitives live in `artifacts/mobile/components/ui/`. Import via the barrel `@/components/ui`. Do not use the flat `colors.ts` values for gradient/glow/shadow — use `constants/theme.ts` which has the full token set.

## Why
Phase 1 established a separation: `colors.ts` holds semantic color tokens (backward-compat with `useColors()`), `theme.ts` holds visual-effect tokens (gradients, glow configs, shadow presets, animation durations, particle configs) that are not part of the original design system.

## How to apply
- Screens: wrap with `<ScreenWrapper>` for the animated parallax background; use `showBackground={false}` for modals.
- Cards: replace `View` cards with `<MagicCard variant="...">`.
- Buttons: replace `Pressable`+gradient combos with `<MagicButton variant="...">`.
- Icons: wrap Feather with `<GlowIcon glowing pulsing>` when the icon needs glow or pulse.
- Tab bar: `ForgeTabBar` is wired as the `tabBar` prop in `ClassicTabLayout`; `NativeTabLayout` (iOS LiquidGlass) is unchanged.
- `useNativeDriver: true` warnings on Expo web are expected — animations degrade gracefully to JS driver on web.
- Asset placeholder directories live in `artifacts/mobile/assets/{images/backgrounds,images/ui,images/decorations,images/icons,animations,effects}`.
