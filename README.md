# OpenPIMS Chromium Extension

Automatic cookie banner blocking through domain-specific HMAC-SHA256 subdomain generation. Works with Chrome, Edge, Brave, and all Chromium-based browsers.

## Description

OpenPIMS Chromium Extension blocks cookie banners by generating unique, domain-specific URLs using deterministic HMAC-SHA256 hashing. Each website you visit gets its own unique OpenPIMS identifier that rotates daily for enhanced privacy.

## Key Features

- **Automatic Cookie Banner Blocking** - No manual interaction needed
- **Domain-Specific Protection** - Each website gets a unique OpenPIMS URL
- **Daily Rotation** - Subdomains regenerate every 24 hours for privacy
- **HMAC-SHA256 Security** - Cryptographically secure subdomain generation
- **Manifest V3 Compliant** - Future-proof implementation
- **Zero Configuration** - Works immediately after login

## Demo

- Try the extension in Chrome: https://chromewebstore.google.com/detail/openpims/pgffgdajiokgdighlhahihihkgphlcnc
- Try the extension in Edge: https://microsoftedge.microsoft.com/addons/detail/openpims/naejpnnnabpkndljlpmoihhejeinjlni


## Other Versions

- [Firefox Extension](https://github.com/openpims/firefox)
- [Safari Extension](https://github.com/openpims/safari)
- [mitmproxy Version](https://github.com/openpims/mitmproxy) - For users who prefer not to use browser extensions

## Installation

### Chromium/Chrome/Edge
1. Clone or download this repository
2. Open Chromium/Chrome and navigate to `chrome://extensions/` (or Edge: `edge://extensions/`)
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the OpenPIMS extension icon in the browser toolbar
2. Enter your server URL (defaults to https://me.openpims.de)
3. Provide your email and password credentials
4. Click "Anmelden" to log in
5. The extension automatically blocks cookie banners on all websites

## Technical Details

### How It Works
The extension generates domain-specific subdomains using HMAC-SHA256:
- **Input**: `userId + visitedDomain + dayTimestamp`
- **Key**: User's secret token (from authentication)
- **Output**: 32-character hex subdomain (DNS compliant)
- **Result**: `https://{subdomain}.openpims.de` unique per domain

The extension uses a dual approach for immediate protection:
- **Content Script**: Injects cookies and headers immediately on page load (first request)
- **Background Service**: Creates declarativeNetRequest rules for subsequent requests
- **No Reload Needed**: Protection active from the first page visit

### Platform Capabilities
| Feature | Chromium | Firefox | Safari |
|---------|----------|---------|---------|
| X-OpenPIMS Headers | ✅ | ✅ | ✅ |
| Cookie Injection | ✅ | ✅ | Desktop: ❌ Mobile: ✅ |
| User-Agent Modification | ✅ | ✅ | ✅ Domain-specific |
| Implementation | Manifest V3 | Manifest V2 | Safari Web Extension |

### API Response Format
```json
{
    "userId": "user123",
    "token": "secret_key_for_hmac",
    "domain": "openpims.de"
}
```

### Testing the API
```bash
curl -u "email@example.com:password" https://me.openpims.de
```

## Files

- `manifest.json` - Manifest V3 configuration with declarativeNetRequest
- `background.js` - Service worker with HMAC subdomain generation
- `content.js` - Content script for immediate cookie injection and header modification
- `action.html` - Popup interface (300px width)
- `options.js` - Login flow and storage management
- `styles.css` - Responsive popup styling
- `openpims.png` - Extension icon

## Security

- **HMAC-SHA256** - Cryptographically secure subdomain generation
- **Daily Rotation** - Subdomains change every 24 hours
- **Domain Isolation** - Each website gets its own unique identifier
- **No Tracking** - No data collection or analytics
- **Local Processing** - All hashing done client-side

## Author

Stefan Böck

## Version

0.1.0

## License

See LICENSE file for details.