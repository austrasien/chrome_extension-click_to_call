# Click-to-Call Google Voice Extension for HubSpot CRM

A professional-grade **Google Chrome extension** (Manifest V3) designed to act as an **auto-dialer integration**, streamlining your sales and cold calling workflow. It automatically transforms static phone numbers on any webpage into clickable **Google Voice links**, eliminating manual data entry.

> **⚡ Optimized for HubSpot CRM:** While it acts as a universal web dialer, this extension provides deep, specialized integration for **HubSpot CRM** to drastically boost sales productivity and ensure seamless call logging.

---

### ☕ Support the Project (Fuel the Development!)
If this sales enablement tool saves you hours of manual dialing and makes your daily HubSpot workflow smoother, consider dropping a tip! 

[![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=for-the-badge&logo=paypal)](https://paypal.me/austraz)

---

### 💬 Feedback & Community
Got a question, found a bug, or have a suggestion? Or maybe you just want to say hello? 
Join the conversation on [**GitHub Discussions**](https://github.com/austrasien/chrome_extension-click_to_call/discussions)! 

---

## 🚀 Overview: The Ultimate Sales Productivity Tool

This extension scans the webpages you visit for phone numbers and converts them into direct links to Google Voice. It eliminates the need for manual dialing or copy-pasting, opening a direct communication channel in a new tab instantly. 

**Why use this extension?**

| Workflow Aspect | Without Extension ❌ | With Click-to-Call ✅ |
| :--- | :--- | :--- |
| **Dialing Speed** | Manual copy-pasting & typing | 1-Click instant dialing |
| **HubSpot Logging** | Often forgotten or messy | Accurate via native CRM buttons |
| **Time per call** | ~15 seconds wasted | **< 1 second** |

> **Note:** This extension is specifically designed for **Google Voice Workspace (Pro)** accounts used by B2B sales teams and SDRs.

## ✨ Key Features & Integrations

### 🛠 Seamless HubSpot CRM Integration
![HubSpot Click-to-Call Preview](readme_pic.png)

- **Intelligent Side-Panel Redirection:** Automatically identifies the active contact in HubSpot's preview panels or contact cards and redirects you to the correct record with `interaction=logged-call` enabled.
- **Uniform Table Layout:** Adds a consistent, green styled "📞 Call" button to the right of phone numbers in HubSpot contact tables using a robust Flexbox layout.
- **Engagement Triggering:** Intercepts native HubSpot "Call" buttons to ensure calls are logged against the correct CRM record, preserving your sales data integrity.

### 🔍 Universal Detection & Smart Filtering
- **Automatic Linkification:** Detects both standard `tel:` HTML links and plain text phone numbers across any website.
- **Heuristic Validation:** Uses advanced filtering to ignore false positives like IDs, invoice numbers, or SKU codes (filtering by length, context keywords, and character patterns).
- **Default Country Prefix:** Automatically prepends **`+33`** (France) to local numbers starting with `0` if no country code is present (perfect for localized sales teams).

### 🌍 Internationalization (i18n)
Full support for multiple languages. The interface automatically adapts to your browser settings:
- 🇬🇧 **English** (Call)
- 🇫🇷 **French** (Appeler)
- 🇪🇸 **Spanish** (Llamar)

### 🏎 Performance & Stability (Manifest V3)
- **Non-Intrusive:** Opens all links in a new tab (`target="_blank"`) to preserve your current workflow and open tabs.
- **High Responsiveness:** Uses an optimized Mutation Observer with a **50ms debounce** to detect new CRM content instantly without impacting CPU usage or slowing down Chrome.
- **Context Awareness:** Engineered to handle extension reloads without crashing or polluting the browser console.

## 🛠 Installation Guide (Developer Mode)

Follow these simple steps to install the extension in your Google Chrome browser:

1.  **Download the Extension:** Scroll to the top of this GitHub repository, click the green **"<> Code"** button, and select **"Download ZIP"**.
2.  **Extract the Files:** Right-click the `.zip` file and select **"Extract All..."** to a folder.
3.  **Open Chrome Extensions Page:** Type `chrome://extensions/` in your Chrome address bar and press **Enter**.
4.  **Enable Developer Mode:** Turn **ON** the "Developer mode" switch in the top right corner.
5.  **Load the Extension:** Click the **"Load unpacked"** button and select the extracted folder (ensure it contains the `manifest.json` file).
6.  **Refresh:** The extension is active! Go back to your HubSpot tabs and **refresh the page (F5)** to see your new click-to-call buttons.

## ⚖️ License

Licensed under the **MIT License**. Permissive for both personal and commercial use, provided attribution is maintained.

---
*Developed to bridge the gap between HubSpot CRM and Google Voice Pro for high-performing sales teams.*
