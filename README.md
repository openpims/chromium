# OpenPIMS Chromium Extension

A Chromium extension for OpenPIMS integration. This extension also works in Chrome and Microsoft Edge.

## Description

OpenPIMS Chromium Extension provides seamless integration with OpenPIMS services. The extension allows users to authenticate and interact with OpenPIMS directly from their browser.

## Features

- User authentication with OpenPIMS
- Server URL configuration
- Clean, responsive popup interface
- Secure credential management

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

1. Click the OpenPIMS extension icon in the Chromium/Chrome toolbar
2. Enter your server URL (defaults to https://me.openpims.de)
3. Provide your email and password credentials
4. Click "Anmelden" to log in

## Files

- `manifest.json` - Extension configuration
- `action.html` - Popup interface
- `options.js` - Extension logic
- `background.js` - Background service worker
- `styles.css` - Stylesheet for the popup
- `openpims.png` - Extension icon

## Author

Stefan Böck

## Version

0.1.0

## License

See LICENSE file for details.