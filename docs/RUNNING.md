# Running the App

Complete [SETUP.md](SETUP.md) before running for the first time.

## Web (recommended for local development)

```bash
npx expo start --web
```

Opens at `http://localhost:8081`. Magic links will redirect back to this URL automatically. Google OAuth works in the browser too. This is the easiest way to test auth flows without a simulator.

## iOS Dev Build

Expo Go does not support the `mytree://` custom URL scheme required for native magic links and Google OAuth. You need a dev build instead.

**First time (compiles native code — takes several minutes):**

```bash
npx expo run:ios
```

If you see a "destination" error, list available simulators and specify one:

```bash
xcrun simctl list devices available
npx expo run:ios --device "iPhone 16 Plus"
```

**Subsequent runs** reuse the compiled build and start much faster.

> To test on a physical iOS device, you need an Apple Developer account and to install the build via Xcode or EAS.

## Android

Android is not yet configured (no `android/` directory). Use web or iOS for now.

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server (choose platform interactively) |
| `npm run web` | Start and open in browser |
| `npm run ios` | Start and open in iOS Simulator |
| `npm test` | Run the test suite |

## Troubleshooting

**App won't start**
- Run `npm install` to ensure dependencies are up to date
- Clear the Metro cache: `npx expo start -c`

**`npx expo run:ios` destination error**
- List simulators: `xcrun simctl list devices available`
- Specify by name: `npx expo run:ios --device "iPhone 16 Plus"`

**Stale bundle on device or simulator**
- Shake the device to open the dev menu → Reload
- Or restart with cache cleared: `npx expo start -c`

**Dependencies broken**
- Delete `node_modules` and `package-lock.json`, then `npm install`
