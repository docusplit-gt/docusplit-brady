# Changelog

All notable changes to the **Brady Audit Suite** will be documented in this file.

## [1.1.0] - 2024-05-20
### Added
- **Success Feedback:** Added `isUploaded` state in the Split module to provide visual confirmation (green checkmark) after successful Google Drive synchronization.
- **Duplicate Prevention:** The "Upload to Drive" button is now disabled after a successful upload to prevent redundant files.

### Changed
- **AI Model Optimization:** Switched from `gemini-3-pro-preview` to `gemini-3-flash-preview`.
  - *Benefit:* Significantly lower operational costs (approx. 15x cheaper).
  - *Benefit:* Faster processing times for multi-page documents.
- **Thinking Budget:** Reduced `thinkingBudget` to 1000 tokens in `services/gemini.ts` to optimize output efficiency for extraction tasks.
- **UI Simplification:** Updated the status badge in the Split module from "Active Configuration (Coolify)" to simply **"Active"**.
- **User Experience:** Refined the upload button transitions and added a success banner in the split results view.

## [1.0.0] - 2024-05-18
### Added
- **Intelligent Splitter:** Core functionality to split master PDFs into individual invoices using Gemini Vision AI.
- **Reconciliation Module:** Capability to cross-reference PDF content with Excel `pickTicketNo` logs.
- **Google Drive Integration:** Automatic folder creation (by Client Name) and file upload via OAuth2.
- **Glassmorphism UI:** Responsive, futuristic corporate design using Tailwind CSS and Lucide icons.
- **Environment Support:** Auto-injection of Drive credentials for Coolify/VPS deployments.

---
*Note: This project follows Semantic Versioning.*
