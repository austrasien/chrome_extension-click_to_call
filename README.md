# Click-to-Call with Google Voice

A professional-grade Google Chrome extension (Manifest V3) designed to streamline your calling workflow by automatically transforming phone numbers on any webpage into clickable **Google Voice** links. 

> **⚡ Optimized for HubSpot:** While it works globally, this extension provides deep, specialized integration for HubSpot CRM to boost sales productivity.

---

### ☕ Support the Project
If this extension saves you time and makes your HubSpot workflow smoother, feel free to support its development!
[**Donate via PayPal**](https://paypal.me/austraz)

---

## 🚀 Overview

This extension scans the webpages you visit for phone numbers and converts them into direct links to Google Voice. It eliminates the need for manual dialing or copy-pasting, opening a direct communication channel in a new tab instantly.

> **Note:** This extension is specifically designed for **Google Voice Workspace (Pro)** accounts.

## ✨ Key Features

### 🛠 Deep HubSpot Integration
- **Intelligent Side-Panel Redirection:** Automatically identifies the active contact in HubSpot's preview panels or contact cards and redirects you to the correct record with `interaction=logged-call` enabled.
- **Uniform Table Layout:** Adds a consistent, green styled "📞 Call" button to the right of phone numbers in HubSpot contact tables using a robust Flexbox layout.
- **Engagement Triggering:** Intercepts native HubSpot "Call" buttons to ensure calls are logged against the correct CRM record.

### 🔍 Universal Detection & Smart Filtering
- **Linkification:** Detects both standard `tel:` links and plain text phone numbers.
- **Heuristic Validation:** Uses advanced filtering to ignore false positives like IDs, invoice numbers, or SKU codes (filtering by length, context keywords, and character patterns).
- **Default Country Prefix:** Automatically prepends **`+33`** (France) to local numbers starting with `0` if no country code is present.

### 🌍 Internationalization (i18n)
Full support for multiple languages. The interface automatically adapts to your browser settings:
- **English** (Call)
- **French** (Appeler)
- **Spanish** (Llamar)

### 🏎 Performance & Stability
- **Non-Intrusive:** Opens all links in a new tab (`target="_blank"`) to preserve your current workflow.
- **High Responsiveness:** Uses an optimized Mutation Observer with a **50ms debounce** to detect new content instantly without impacting CPU usage.
- **Context Awareness:** Engineered to handle extension reloads without crashing or polluting the browser console.

## 🛠 Installation

Since this extension is in development mode:

1.  **Download/Clone** this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **"Developer mode"** (toggle in the top right).
4.  Click **"Load unpacked"** and select the extension folder.
5.  **Refresh your HubSpot tabs** to activate the script.

## 📖 How it Works

The background script (`content.js`) performs the following steps:
1.  **Scans the DOM** using a specialized TreeWalker to find text nodes and phone fields.
2.  **Validates** potential numbers against exclusion lists (ID, Ref, SKU, Batch, etc.).
3.  **Sanitizes** strings and encodes the `+` prefix for Google Voice compatibility.
4.  **Injects** styled buttons or wraps text in high-priority green links (`#0b8043`).

## ⚖️ License

Licensed under the **MIT License**. Permissive for both personal and commercial use, provided attribution is maintained.

---
*Developed to bridge the gap between HubSpot CRM and Google Voice Pro.*
