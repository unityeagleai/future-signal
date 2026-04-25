---
version: "alpha"
name: Future Signal
description: "A private mobile-first PWA for daily transmissions from your future self. Dark, cinematic, intimate, slightly futuristic — quiet sci-fi, not loud cyberpunk."
colors:
  background: "#0A0E1F"
  panel: "#1A1A2E"
  panel-2: "#141428"
  primary: "#00E5FF"
  secondary: "#D4A056"
  parchment: "#E8DDC7"
  cream: "#F4EAD8"
  text: "#C8D8E0"
  text-dim: "rgba(200, 216, 224, 0.45)"
  border: "rgba(0, 229, 255, 0.12)"
  border-amber: "rgba(212, 160, 86, 0.25)"
  letter-ink: "#2A1F14"
typography:
  display:
    fontFamily: Orbitron
    fontWeight: 700
    letterSpacing: 0.1em
    textTransform: uppercase
  mono:
    fontFamily: Share Tech Mono
    fontSize: 0.65rem
    letterSpacing: 0.15em
    textTransform: uppercase
  serif:
    fontFamily: EB Garamond
    fontSize: 1rem
    lineHeight: 1.8
    fontStyle: normal
  ui:
    fontFamily: Rajdhani
    fontWeight: 500
    fontSize: 1rem
rounded:
  sm: 6px
  md: 10px
  lg: 12px
  full: 100px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  btn-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.background}"
    typography: "{typography.display}"
    rounded: "{rounded.md}"
    padding: 16px 24px
  btn-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-dim}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  chip-active:
    backgroundColor: "rgba(0, 229, 255, 0.08)"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
  chip-amber-active:
    backgroundColor: "rgba(212, 160, 86, 0.08)"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
  letter-card:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.letter-ink}"
    typography: "{typography.serif}"
    rounded: "{rounded.lg}"
  panel-card:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
  bottom-nav:
    backgroundColor: "rgba(10, 14, 31, 0.92)"
    textColor: "{colors.text-dim}"
  bottom-nav-active:
    textColor: "{colors.primary}"
  audio-player:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
  mood-tag-cyan:
    backgroundColor: "rgba(0, 229, 255, 0.06)"
    textColor: "rgba(0, 229, 255, 0.8)"
    rounded: "{rounded.full}"
  mood-tag-amber:
    backgroundColor: "rgba(212, 160, 86, 0.06)"
    textColor: "rgba(212, 160, 86, 0.8)"
    rounded: "{rounded.full}"
---

## Overview

Future Signal is a private daily ritual app — not productivity, not wellness, not therapy. It is a **temporal transmission**: one letter per day from the user's future self, delivered as both text and voice.

The interface should feel like **black glass, amber memory light, and parchment letters** lit from within. The aesthetic is quiet sci-fi — intimate and cinematic, not loud or cyberpunk. Think observatory at night. Private archive. A signal slipped through time.

Every design decision should reinforce the feeling that the user has received something that was waiting for them.

## Colors

The palette is built on contrast between cold signal and warm memory.

- **Background (#0A0E1F):** Midnight blue-black. Deep space. The void the signal travels through.
- **Panel (#1A1A2E):** Deep gunmetal. Slightly lighter than background. Cards, surfaces, containers.
- **Primary (#00E5FF):** Cyan signal glow. Used for UI chrome, labels, navigation highlights, waveforms, borders on interactive elements. Always at reduced opacity for borders/backgrounds (10–15% alpha).
- **Secondary (#D4A056):** Warm amber. Memory light. Used for dates, CTAs, highlights, save buttons. The human warmth against the cold signal.
- **Parchment (#E8DDC7):** The letter card background only. Carries a subtle grain texture. Suggests age, time travel, physical documents. Never used for UI panels.
- **Cream (#F4EAD8):** Main text on parchment and bright text on dark panels. Warm, not pure white.
- **Letter Ink (#2A1F14):** Dark warm brown for text on parchment. Not black — feels handwritten.
- **Text (#C8D8E0):** Default body text on dark backgrounds. Desaturated blue-white.
- **Text-Dim:** 45% opacity of Text. For labels, metadata, placeholder text.

## Typography

Four families, each with a specific role:

- **Orbitron** — Display only. App title, section headers, transmission titles. The future voice.
- **Share Tech Mono** — All labels, metadata, dates, chip text, navigation. The machine voice.
- **EB Garamond** — All letter body text, reflection questions, journal entries, excerpts. The human voice.
- **Rajdhani** — UI body text, voice style names, settings labels. The present voice.

The contrast between Orbitron/Mono (cold, structural) and Garamond (warm, personal) is intentional. It creates the sense that the letter arrives from somewhere else.

## Layout

- **Mobile-first**: Max-width 430px, centered on larger screens.
- **Safe areas**: Always respect `env(safe-area-inset-bottom)` for iPhone notch/home indicator.
- **Bottom nav height**: 64px + safe-bottom-inset.
- **Scroll**: Only within `#screen-container`. Never on `body`. Use `-webkit-overflow-scrolling: touch`.
- **Screens**: Absolute positioned in the container, transition via opacity + translateY.

## Elevation & Depth

- **Letter card**: Most elevated. `box-shadow: 0 4px 32px rgba(0,0,0,0.4)` — feels like a physical document.
- **Panels**: Mid-level. Subtle `border: 1px solid rgba(0,229,255,0.12)`.
- **Background**: Bottom layer. No border.
- Avoid hard drop shadows on dark UI elements — use glow effects instead.

## Shapes

- Most elements: `border-radius: 12px`
- Chips, tags, badges: `border-radius: 100px` (pill)
- Buttons: `border-radius: 8px`
- Audio play button: `border-radius: 50%` (circle)

## Components

**Letter Card**: Parchment background, grain texture overlay, warm ink text, subtle border, significant elevation. The most important component — should feel like you are unfolding something.

**Audio Player**: Dark panel. Animated waveform bars (cyan). Circular play button with glow. Minimal — like a voice recorder, not a music app.

**Mood Tags**: Small pills. Color-coded: cyan for signal/tech moods, amber for personal/emotional moods, purple for cosmic/strange moods, green for growth moods.

**Chips (settings)**: Inactive = dim border, dim text. Active = colored border + text + faint glow background.

**Bottom Nav**: Frosted glass. Inactive = dim. Active = cyan glow + drop-shadow on icon.

## Do's and Don'ts

**Do:**
- Use grain textures (subtle, 3–5% opacity) on parchment and overlays
- Animate the waveform when audio is playing — static bars feel dead
- Let signal lines (thin cyan gradients) appear as decorative horizontal elements
- Use `EB Garamond italic` for reflection questions — makes them feel contemplative
- Apply `letter-spacing: 0.15–0.2em` to all mono labels
- Use `pulse` animation on active indicators (cyan dot, future date dot)

**Don't:**
- Use pure white (#ffffff) anywhere — always use cream or parchment tones
- Add animations that feel like notifications or alerts — everything should be slow and deliberate
- Use emoji in the interface (except ambient background icons)
- Use bright colored fills for large surfaces — keep fills at 5–10% opacity max
- Add social features, share buttons, or gamification elements
- Make anything feel like a notification
