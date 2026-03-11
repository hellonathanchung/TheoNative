# Deployment

This project uses Expo + EAS Build. Use the profiles in `eas.json`.

## Prerequisites
- Expo account with access to the project slug `theo-native`.
- EAS CLI installed and authenticated.
- Apple and Google Play credentials configured in EAS (or supplied at build time).

## Build Profiles
- `development`: Dev client for local testing (iOS simulator enabled).
- `preview`: Internal distribution for QA.
- `production`: App store builds with auto-incrementing versions.

## Common Commands

### Development client
```bash
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

### Internal preview
```bash
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android
```

### Production release
```bash
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
```

## Submitting to Stores

```bash
npx eas submit --profile production --platform ios
npx eas submit --profile production --platform android
```

## Versioning Notes
- `eas.json` uses `appVersionSource: remote`, so EAS controls version bumps.
- Update `app.json` if you need to change display name, bundle identifiers, or assets.

## Troubleshooting
- If Skia or native modules fail in Expo Go, use the `development` build profile to create a dev client.
- For iOS, ensure the bundle identifier matches the App Store Connect record.
- For Android, ensure the package name matches the Play Console record.
