# Click-to-Call Linker for Google Voice

A lightweight Google Chrome extension (Manifest V3) designed to streamline your calling workflow by automatically transforming phone numbers on any webpage into clickable **Google Voice** links.

> **Note:** This extension is specifically designed for **Google Voice Workspace (Pro)** accounts, typically used in professional environments.

## 🚀 Overview

This extension scans the webpages you visit for phone numbers and converts them into direct links to Google Voice (`https://voice.google.com/`). It is specifically optimized for CRM platforms like **HubSpot**, making it a powerful tool for sales and support teams who use Google Voice as their primary calling solution.

## ✨ Key Features

- **Automated Linkification:** Detects plain text phone numbers and turns them into clickable links.
- **Google Voice Integration:** Instead of standard `tel:` links, it generates URLs formatted for Google Voice (e.g., `https://voice.google.com/u/0/calls?a=nc,%2B33640...`).
- **HubSpot Optimization:** 
    - Intercepts "Call" buttons to handle HubSpot's internal tracking parameters.
    - Specifically targets phone fields in contact lists and table views.
- **Smart Input Detection:** Adds a "📞 Call" button next to input fields and textareas that appear to contain phone numbers.
- **New Tab Opening:** All generated links open in a new tab (`target="_blank"`), ensuring you don't lose your place on your current page.
- **Dynamic Content Support:** Uses a Mutation Observer to detect and process numbers even on pages that load content dynamically (AJAX/SPA).

## 🛠 Installation

Since this extension is in development mode, follow these steps to install it in Google Chrome:

1.  **Download/Clone** this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **"Developer mode"** using the toggle switch in the top right corner.
4.  Click the **"Load unpacked"** button.
5.  Select the folder containing the extension files (where `manifest.json` is located).
6.  The extension is now active! You can pin it to your toolbar for easy access.

## 📖 How it Works

The extension runs a background script (`content.js`) that:
1.  Identifies phone numbers using optimized regular expressions.
2.  Filters out "forbidden" tags (like existing links or script blocks) to prevent breaking website layouts.
3.  Sanitizes the number (removes spaces, dots, and dashes).
4.  **Automatic Prefixing:** If a number starts with `0` and has no country code, it automatically prepends **`+33`** (France) to ensure Google Voice recognizes it correctly.
5.  Wraps the text in a styled link or adds a button near input fields.

## ⚖️ License

This project is licensed under the **MIT License**.

### What does this mean?
The MIT License is a short and permissive software license. It basically allows you to do whatever you want with the code as long as you provide attribution back to the original author and don't hold them liable.

- **Permission:** You can use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software.
- **Condition:** You must include the original copyright notice and this permission notice in any substantial portion of the software.
- **No Warranty:** The software is provided "as is", without warranty of any kind. The authors are not liable for any claims or damages.

---
*Developed to bridge the gap between web-based CRMs and Google Voice.*
