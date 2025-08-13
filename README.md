# openPIMS Chrome Extension

A Chrome extension for openPIMS integration.

## Description

openPIMS Chrome Extension provides seamless integration with openPIMS services. The extension allows users to authenticate and interact with openPIMS directly from their browser.

## Features

- User authentication with openPIMS
- Server URL configuration
- Clean, responsive popup interface
- Secure credential management

## Demo

Try the extension: https://chromewebstore.google.com/detail/openpims/pgffgdajiokgdighlhahihkgphlcnc

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the openPIMS extension icon in the Chrome toolbar
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