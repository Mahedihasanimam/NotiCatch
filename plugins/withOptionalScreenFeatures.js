const { withAndroidManifest } = require('expo/config-plugins');

/**
 * `orientation: 'portrait'` makes Android imply android.hardware.screen.portrait as REQUIRED,
 * which Google Play uses to hide the app from tablets, Chromebooks, desktop and XR devices.
 * Declaring the features as optional keeps the portrait lock but lets every device install it.
 */
const FEATURES = ['android.hardware.screen.portrait', 'android.hardware.screen.landscape'];

module.exports = function withOptionalScreenFeatures(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';
    const existing = manifest['uses-feature'] || [];
    const others = existing.filter((f) => !FEATURES.includes(f.$['android:name']));
    manifest['uses-feature'] = [
      ...others,
      ...FEATURES.map((name) => ({
        $: { 'android:name': name, 'android:required': 'false', 'tools:replace': 'android:required' },
      })),
    ];
    return cfg;
  });
};
