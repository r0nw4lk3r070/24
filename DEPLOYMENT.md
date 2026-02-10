# Nalid24 Deployment Guide

## APK Distribution Setup (Firebase Hosting + GitHub)

This guide covers deploying the Nalid24 landing page and APK distribution.

### Architecture
- **Firebase Hosting**: Serves landing page (~5 KB per visit)
- **GitHub Releases**: Hosts APK files (unlimited bandwidth)
- **QR Code**: Points to Firebase landing page → GitHub download

---

## 1. GitHub Repository Setup

### Create Repository
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Nalid24 Messenger v1.0.0"

# Create repo on GitHub (https://github.com/new)
# Name: nalid24
# Description: Privacy-focused messaging with 24h auto-delete
# Public repository (required for unlimited releases bandwidth)

# Add remote and push
git remote add origin https://github.com/yourusername/nalid24.git
git branch -M main
git push -u origin main
```

### Create First Release
```bash
# Build release APK (if not already done)
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
cd android
.\gradlew.bat assembleRelease
cd ..

# Go to GitHub: https://github.com/yourusername/nalid24/releases/new
# Tag version: v1.0.0
# Release title: Nalid24 v1.0.0 - Initial Release
# Description: First stable release with Firebase real-time messaging
# Upload file: android/app/build/outputs/apk/release/app-release.apk
# Publish release
```

### Get Direct Download URL
After publishing, right-click the APK file → Copy link address

Format: `https://github.com/yourusername/nalid24/releases/download/v1.0.0/app-release.apk`

---

## 2. Firebase Hosting Setup

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Login to Firebase
```bash
firebase login
```

### Verify Configuration
Files already created:
- `firebase.json` - Hosting configuration
- `.firebaserc` - Project configuration (nalid24-a7401)
- `public/index.html` - Landing page
- `public/404.html` - Error page

### Update Download URL
Edit `public/index.html` line 154:
```html
<a href="https://github.com/YOURUSERNAME/nalid24/releases/latest/download/app-release.apk" class="download-btn">
```

Replace `YOURUSERNAME` with your actual GitHub username.

### Deploy to Firebase
```bash
firebase deploy --only hosting
```

Your site will be live at: `https://nalid24-a7401.web.app`

---

## 3. InviteScreen Implementation

The InviteScreen shows a QR code pointing to your Firebase landing page.

Already implemented in: `src/screens/InviteScreen.tsx`

Users scan this QR code → Opens landing page → Downloads APK from GitHub.

---

## 4. Update Landing Page (Optional)

To customize branding:

### Update Colors
Edit `public/index.html` CSS variables:
- Primary gradient: `#667eea` to `#764ba2`
- Logo background: Line 33-34
- Button gradient: Line 99-100

### Update Features
Edit feature list starting at line 176:
```html
<div class="feature">
  <div class="feature-icon">🔒</div>
  <div>Your feature text</div>
</div>
```

### Custom Domain (Optional - Firebase Free Tier)
```bash
# Add custom domain in Firebase Console
# Hosting → Add custom domain
# Follow DNS configuration instructions
```

---

## 5. Future Releases

### Version Update Workflow
```bash
# 1. Update version in package.json
npm version patch  # or minor, or major

# 2. Rebuild APK
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle
cd android
.\gradlew.bat assembleRelease
cd ..

# 3. Create GitHub release
# Tag: v1.0.1 (or next version)
# Upload: android/app/build/outputs/apk/release/app-release.apk

# 4. Update landing page if needed
# Edit public/index.html version number
firebase deploy --only hosting

# 5. Commit changes
git add .
git commit -m "Release v1.0.1"
git push
```

---

## 6. Monitoring & Analytics

### Firebase Hosting Usage
```bash
# Check bandwidth usage
firebase hosting:channel:list

# View hosting logs
firebase hosting:channel:open
```

### GitHub Release Stats
- Go to: https://github.com/yourusername/nalid24/releases
- View download counts for each version

---

## Bandwidth Estimates

### GitHub Releases (Free, Unlimited)
- APK downloads: **Unlimited**
- No bandwidth caps for public repos

### Firebase Hosting (Free Tier)
- Landing page (~5 KB HTML + CSS)
- 360 MB/day = **~72,000 page visits/day**
- 10 GB/month = **~2,000,000 page visits/month**

**Result**: Effectively unlimited distribution capacity.

---

## Troubleshooting

### Firebase Deploy Fails
```bash
# Re-login
firebase login --reauth

# Check project
firebase projects:list

# Use specific project
firebase use nalid24-a7401
```

### GitHub Release Not Found
- Ensure release is published (not draft)
- Use correct URL format: `/releases/download/v1.0.0/app-release.apk`
- Or use `/releases/latest/download/app-release.apk` for auto-redirect

### Landing Page Not Updating
```bash
# Clear cache
firebase hosting:channel:delete preview

# Force redeploy
firebase deploy --only hosting --force
```

---

## Cost Breakdown (Free Tier)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| GitHub Releases | Unlimited | APK hosting | $0 |
| Firebase Hosting | 10 GB/month | Landing page | $0 |
| Firebase Database | 1 GB storage | Messages (24h) | $0 |
| Firebase Functions | 2M invocations | Notifications | $0 |
| **Total** | | | **$0/month** |

All features run on free tier indefinitely.
