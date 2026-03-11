import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// On web, we must initialize CanvasKit WASM *before* App (and its entire
// module tree, including Skia.web.js) is evaluated. Skia.web.js runs:
//   export const Skia = JsiSkApi(global.CanvasKit)
// at module-evaluation time, so global.CanvasKit must already be set.
//
// We achieve this by deferring require('./App') until LoadSkiaWeb resolves.
// In Metro, require() is lazy — the module factory only runs on first call —
// so putting it inside an async function lets us control the timing.
async function main() {
  if (Platform.OS === 'web') {
    const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
    await LoadSkiaWeb({
      // Metro dev server can't serve .wasm with correct MIME type; use CDN.
      // Must point at bin/full/ to match the JS loaded from canvaskit-wasm/bin/full/canvaskit.
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.40.0/bin/full/${file}`,
    }).catch((e: unknown) => console.warn('Skia web init failed:', e));
  }

  // Now that global.CanvasKit is set, require App and its full dependency
  // tree (including Skia.web.js). registerRootComponent calls
  // AppRegistry.registerComponent('main', () => App) and ensures the
  // environment is set up correctly for both Expo Go and native builds.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const App = require('./App').default;
  registerRootComponent(App);
}

main();
