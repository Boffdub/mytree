# iOS Simulator + Expo dev client

## `CommandError: No development build (com.anonymous.MyTree) ... is installed`

**What it means:** Expo is trying to open the dev client on the **simulator that is currently booted**, but that device does not have MyTree installed.

**Typical cause:** You installed the app on one simulator (e.g. “MyTree Clean iPhone 16”), then **Simulator** or Expo switched the booted device to another model (e.g. “iPhone 16 Pro”) that was never built with `expo run:ios`.

**Fix (pick one):**

1. **Install the dev client on whatever simulator is booted** (recommended):

   ```bash
   npm run ios
   ```

   or `npx expo run:ios`

   Wait until the build finishes and the app appears. After that, `npx expo start --dev-client` and press **`i`** as usual.

2. **Or** boot the simulator that already has MyTree: **Simulator → File → Open Simulator →** pick that device, then run Expo again.

**Daily workflow:** `npx expo start --dev-client` (or `npm run start:dev-client`). Use `npm run ios` only after native changes, new machine, or a new/erased simulator.
