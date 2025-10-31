# ⚠️ DEPRECATED - This repository is deprecated

## 🚨 This browser-specific repository is no longer maintained!

### ➡️ Please use the new unified repository instead:
## **https://github.com/openpims/extensions**

---

## Why the change?

We've migrated to a unified codebase that supports all browsers from a single repository:
- ✅ **One codebase** for Chrome, Firefox, Safari, Edge, Brave, Opera
- ✅ **Modern stack** with WXT framework and TypeScript
- ✅ **Easier maintenance** - updates apply to all browsers at once
- ✅ **Better performance** - 50% smaller bundle size
- ✅ **Hot Module Reload** for faster development

## Migration Guide

### For Users:
1. Uninstall the old Chrome extension
2. Install the new extension from: [Coming Soon to Chrome Web Store]
3. Your settings will be automatically migrated

### For Developers:
```bash
# Clone the new unified repository
git clone https://github.com/openpims/extensions.git
cd extensions

# Install dependencies
npm install

# Run development mode for Chrome
npm run dev:chrome

# Build for Chrome
npm run build:chrome
```

## What's improved in v2.0?

- 🚀 Native Web Crypto API (no more CryptoJS)
- 📦 Bundle size: 135KB → 66KB (51% smaller)
- 🔒 Better security with daily token rotation
- 🌐 Cross-browser compatibility from single codebase
- 📱 iOS Safari support
- ⚡ Faster HMAC calculation (10ms → 2ms)

## Support

- New Repository: https://github.com/openpims/extensions
- Issues: https://github.com/openpims/extensions/issues
- Website: https://openpims.de

---

**This repository is archived and read-only. No further updates will be made here.**

Last version in this repository: v1.1.0
New unified version: v2.0.0+