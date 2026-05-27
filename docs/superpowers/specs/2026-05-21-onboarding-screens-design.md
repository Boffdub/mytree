# Onboarding Screens Design

**Date:** 2026-05-21  
**Status:** Approved

## Overview

A 5-slide onboarding carousel shown once on first launch (for non-authenticated users), explaining core game mechanics. Replayable via "How to Play" in Settings.

## Flow & Routing

`App.js` checks AsyncStorage for `hasSeenOnboarding` before determining `initialRoute`. If the flag is absent, `initialRoute` is `Onboarding`; otherwise the existing logic (`Welcome` or `Home`) applies.

```
First launch:   loading → Onboarding → Welcome → Home
Return visits:  loading → Welcome (or Home if already signed in)
How to Play:    Settings → Onboarding (returns to Settings on finish/skip)
```

The `Onboarding` screen accepts an optional `returnTo` nav param (`'Welcome'` by default, `'Settings'` when launched from How to Play). On completion or skip, `hasSeenOnboarding = 'true'` is written to AsyncStorage and the user is navigated to `returnTo`.

A new `Stack.Screen name="Onboarding"` is added to the navigator in `App.js`.

## Slide Content

| # | `score` | Caption |
|---|---------|---------|
| 1 | 0 | Your tree starts at 0. |
| 2 | 1 | When you get a question right, your tree grows. |
| 3 | 3 | Depending on the difficulty you choose, wrong answers might make your tree shrink. You'll pick your level after you log in. |
| 4 | 5 | You grow a full tree when you get 5 correct questions in a row. |
| 5 | 5 | You get 3 lifelines to help you but the available lifelines depend on the difficulty you choose. |

Slide 5 replaces the caption with 3 lifeline rows (icon + name + description):
- **50/50** — 2 of the wrong choices will be removed
- **Infographics** — We'll show an infographic that could help you
- **Shield** — Your tree will not shrink for at least 1 question

## Component Structure

**New file:** `screens/OnboardingScreen.js`

A `ONBOARDING_SLIDES` array at the top of the file holds all slide data (score, caption, optional lifelines flag). No slide logic lives outside this file.

### Layout (per slide, full-screen)

- **Background:** `LinearGradient` (`colors.lightGreen` → `colors.white`) — same as WelcomeScreen
- **Top:** "My Tree" title (`colors.primaryGreen`, `fonts.bold`) + tagline ("Answer questions about the climate to grow your virtual tree!", `fonts.regular`, `colors.gray`)
- **Middle:** `TreeComponent` with slide's `score`, `showGround={false}`
- **Side arrows:** `◄` / `►` (`TouchableOpacity`) flanking the tree; left arrow hidden on slide 1, right arrow hidden on slide 5
- **Bottom (slides 1–4):** caption text (`fonts.regular`) + 5 dot indicators (active dot filled `colors.primaryGreen`, inactive `colors.grayLight`)
- **Bottom (slide 5):** lifeline rows + green "Get Started" button (same style as `emailButton` in WelcomeScreen)
- **Top-right (slides 1–4):** "Skip" `TouchableOpacity` in `colors.gray`; hidden on slide 5

### Navigation mechanism

`FlatList` with `horizontal`, `pagingEnabled`, `scrollEnabled`, `showsHorizontalScrollIndicator={false}`. `onScroll` updates `currentIndex` state. Arrow button taps call `flatListRef.current.scrollToIndex(...)`.

## Settings Change

`SettingsScreen.js` gets a "How to Play" row that navigates to `Onboarding` with `{ returnTo: 'Settings' }`. Styled consistently with existing settings rows.

## AsyncStorage Key

`@mytree_has_seen_onboarding` — set to `'true'` on skip or completion. Checked in `App.js` during the `init` phase alongside the existing guest mode flag check.

## Files Changed

| File | Change |
|------|--------|
| `App.js` | Add `hasSeenOnboarding` check, add `Onboarding` route |
| `screens/OnboardingScreen.js` | New file |
| `screens/SettingsScreen.js` | Add "How to Play" row |
