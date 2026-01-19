<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI:PPROVAL - Webasto Supplier Deviation Approval System

A **High-Fidelity Enterprise Quality Management System (QMS)** for Webasto Supplier Deviation Approval (SDA) process, designed to modernize and automate IATF 16949 compliance workflows in automotive manufacturing.

## Features

- 🤖 **AI-Powered Quality Auditor** - Configurable AI provider integration for intelligent deviation analysis
- 🔒 **Intelligent Redaction** - Automatic PII detection and masking for data sovereignty
- 🌍 **Multi-Lingual Translation** - Technical translation with glossary preservation (English, Deutsch, 日本語)
- 📄 **PDF/A Export** - ISO 9001 & IATF 16949-compliant document generation with QR codes
- 📊 **FMEA Risk Engine** - Automated RPN calculation and risk assessment
- 🔄 **Dynamic Approval Routing** - Logic-based workflow determined by BU, Trigger, and Duration
- 🎨 **Premium Enterprise UI** - Apple-style glassmorphism design with golden gradients
- 🏭 **Dual Deviation Types** - Support for both Supplier and Customer deviation workflows
- 📈 **Advanced Analytics** - Material Risk Heatmaps, RPN trends, and predictive timelines
- 🎤 **Voice Assistant** - Voice-to-text transcription and structured data extraction
- 📱 **Offline PWA** - Service Worker caching with Background Sync API
- 📋 **Comprehensive Archive** - Advanced filtering, search, and export capabilities
- ⚙️ **Admin Console** - User management, routing matrix, AI governance, and system settings
- ✅ **ISO 9001 & IATF 16949** - Dual-standard compliance tracking and audit readiness

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file and set your AI API key (optional - app works without it):
   ```
   # Use AI_API_KEY for auto-detection, or provider-specific keys:
   AI_API_KEY=your_api_key_here
   # Or specify provider explicitly:
   # AI_PROVIDER=gemini|openai|anthropic
   # GEMINI_API_KEY=your_key (for Gemini)
   # OPENAI_API_KEY=your_key (for OpenAI)
   # ANTHROPIC_API_KEY=your_key (for Anthropic)
   ```
   
   **Note:** The app will work without an API key, but AI features (analysis, voice, translation) will be disabled.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deploy to Vercel

See [docs/vercel-deployment.md](./docs/vercel-deployment.md) for detailed deployment instructions.

Quick steps:
1. Connect your GitHub repo to Vercel
2. Add `AI_API_KEY` environment variable in Vercel project settings
3. Deploy!

## Documentation

See the [`docs/`](./docs/) folder for comprehensive documentation:
- [Architecture Documentation](./docs/architecture.md) - System architecture and design
- [Quick Reference Guide](./docs/quick-reference.md) - Developer quick reference
- [Strategic Roadmap](./docs/strategic-roadmap.md) - Future enhancements and roadmap
- [Vercel Deployment Guide](./docs/vercel-deployment.md) - Deployment instructions

## Tech Stack

- **React 19** + **TypeScript** - Modern frontend framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **AI Provider** - Configurable AI service (supports Gemini, OpenAI, Anthropic, or custom)
- **jsPDF** - PDF generation
- **QRCode** - QR code generation

## Project Structure

```
├── components/          # React components
├── services/           # Business logic services
├── docs/              # Documentation
├── types.ts           # TypeScript type definitions
├── constants.tsx       # Master data and constants
└── App.tsx            # Main application component
```

## License

Proprietary - Webasto Quality Engineering Team
