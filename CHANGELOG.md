# Changelog

All notable changes to the AI:PPROVAL project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Predictive Approval Timelines** - Real-time prediction of approval completion dates with bottleneck detection
- **Interactive Adaptive Cards** - Microsoft Teams and Slack integration for chat-based approvals
- **Product Safety Comment Field** - Always-visible comment field for product safety notes
- **FAQ Page** - Comprehensive FAQ with 20 questions, glossary, and bug report form
- **Vision-Based Deviation Verification** - AI-powered image analysis for non-conformity detection
- **8D/CAPA Mapping** - One-click 8D report generation from deviation data
- **Theme System** - Dark and light mode with Apple-inspired glassmorphism design
- **Approval Timeline Component** - Visual timeline showing step-by-step predictions
- **Adaptive Card Preview** - Preview and send approval cards to Teams/Slack
- **AI Recommendations** - AI-generated suggestions for risks and actions
- **Conflict Detection** - Proactive similarity conflict alerts
- **Enhanced Calendar Icon** - Improved expiration date field with calendar icon

### Changed
- **Provider-Agnostic AI Service** - Abstracted AI integration to support multiple providers (Gemini, OpenAI, Anthropic)
- **Renamed IATF Risk Score** - Changed to "Compliance Risk Score" for broader applicability
- **UI Design System** - Consolidated CSS into `index.css` with token-based color system
- **Button Styling** - Enhanced action buttons with semantic colors (red for discard, blue for primary)
- **Status Pills** - Improved contrast and visibility in both light and dark modes
- **Sidebar Navigation** - Added liquid glass hover effects and improved contrast
- **New Deviation Layout** - Reorganized header with timeline above buttons, title on left

### Fixed
- **Text Contrast** - Improved text visibility in both light and dark modes across all components
- **Dropdown Styling** - Fixed duplicate chevron issue in select dropdowns
- **Nested Scrolling** - Eliminated nested scrollbars for better UX
- **Hover Effects** - Fixed reversed hover states on segmented tabs
- **Status Visibility** - Enhanced status pill contrast in light mode

### Removed
- **GeminiService** - Replaced with provider-agnostic `AIService`

## [1.0.0] - 2025-01-27

### Added
- Initial project setup with React 19 + TypeScript + Vite
- Core deviation management workflow
- FMEA risk engine with RPN calculation
- Dynamic approval routing based on BU, Trigger, and Duration
- AI-powered quality auditor integration
- PDF/A compliant export with QR codes
- Multi-lingual technical translation
- Intelligent redaction for PII protection
- Glassmorphism design system
- Dashboard with analytics and activity feed

### Technical Stack
- React 19 + TypeScript
- Vite build system
- Tailwind CSS for styling
- Provider-agnostic AI service layer
- jsPDF for PDF generation
- QRCode library for QR code generation

---

## Version History

- **v1.0.0** (2025-01-27): Initial release with core QMS functionality
- **v1.1.0** (Unreleased): Phase 2 features - Predictive Timelines, Adaptive Cards, Enhanced UI

---

## Development Notes

### Breaking Changes
- None in current version

### Migration Guide
- When upgrading, ensure `.env.local` includes `AI_API_KEY` instead of provider-specific keys
- Theme preferences are stored in localStorage and will persist across sessions

### Known Issues
- Adaptive Cards use mock API - requires Teams/Slack API integration for production
- Prediction service uses mock historical data - needs database integration for real predictions

### Future Enhancements
- Voice Assistant for hands-free deviation entry
- Advanced Analytics with heatmaps and clustering
- Offline PWA capabilities
- Real-time collaborative editing
- Supplier self-service portal
