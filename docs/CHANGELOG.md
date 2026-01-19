# Changelog - AI:PPROVAL

All notable changes to the Webasto Supplier Deviation Approval System will be documented in this file.

## [2.1.0] - 2025-01-28

### Added
- **Comprehensive Archive Page**
  - Advanced filtering by status, BU, date range, and search
  - Statistics cards (Total, Approved, Rejected, Avg Cycle Time, High Risk)
  - Enhanced table with export functionality
  - Pagination controls
  - Dynamic content based on Supplier/Customer selection

- **Enhanced Admin Console**
  - New "System Settings" section
  - System configuration panel
  - Notification settings (Email, Slack, Teams)
  - Compliance settings (PDF/A level, auto-archive, IATF mode)
  - Data retention policies
  - Audit logs with activity tracking

- **ISO 9001 & IATF 16949 Dual Compliance**
  - Compliance dashboard with dual-standard metrics
  - Updated compliance page with ISO 9001 and IATF 16949 requirements
  - Enhanced compliance tracking and reporting

- **UI/UX Enhancements**
  - Golden gradient segmented control with liquid glass effect
  - Mandatory field indicators with red borders
  - Improved Material Risk Heatmap typography and visibility
  - Enhanced form validation and button states
  - Better text contrast in dark/light modes
  - Improved spacing and padding throughout

- **Form Improvements**
  - Active "Save Draft" and "Submit" buttons with confirmation modals
  - Actions logged in predictive timeline
  - "Discard" button with confirmation dialog
  - Better button color coding (red for Discard, primary for Submit)

### Changed
- **Deviation Type Toggle**
  - Moved Supplier/Customer toggle to header
  - All pages dynamically adapt to selected deviation type
  - Dashboard metrics update based on type
  - Archive filters by deviation type automatically

- **Material Risk Heatmap**
  - Improved typography (larger fonts, better visibility)
  - Enhanced text shadows on colored backgrounds
  - Better spacing and padding
  - Improved legend visibility
  - Larger selected cell details panel

- **Design System**
  - Enhanced golden gradient backgrounds
  - Improved glassmorphism effects
  - Better contrast ratios for accessibility
  - Refined hover effects and transitions

### Fixed
- Button functionality (Discard, Save Draft, Submit) now working correctly
- Confirmation modals properly integrated
- Timeline integration for user actions
- Improved visibility in both dark and light modes
- Better contrast for all text elements

## [2.0.0] - 2025-01-27

### Added
- **Voice Assistant** ("I A:M Q")
  - Voice-to-text transcription
  - Structured data extraction from voice commands
  - Floating button interface
  - Integration with deviation form

- **Advanced Analytics**
  - Material Risk Heatmaps
  - RPN trend analysis
  - Supplier/Customer clustering
  - Predictive risk indicators

- **Offline-First PWA Capabilities**
  - Service Worker for caching
  - IndexedDB for local storage
  - Background Sync API
  - Offline indicator component

- **Predictive Approval Timelines**
  - Timeline visualization
  - Bottleneck identification
  - Date predictions based on historical data

- **Adaptive Cards**
  - Microsoft Teams integration
  - Slack integration
  - One-click approvals
  - Interactive card previews

### Changed
- Comprehensive UI redesign with Apple-inspired glassmorphism
- Enhanced dark/light mode support
- Improved responsive design
- Better accessibility and contrast

## [1.1.0] - 2025-01-20

### Added
- Initial release with core QMS functionality
- AI-powered quality auditor
- FMEA risk engine
- Dynamic approval routing
- PDF/A export
- Multi-lingual translation

---

**Note**: This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) principles.
