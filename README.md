<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI:PPROVAL - Webasto Supplier Deviation Approval System

A **High-Fidelity Enterprise Quality Management System (QMS)** for Webasto Supplier Deviation Approval (SDA) process, designed to modernize and automate IATF 16949 compliance workflows in automotive manufacturing.

## Features

- 🤖 **AI-Powered Quality Auditor** - Gemini 3 Pro integration for intelligent deviation analysis
- 🔒 **Intelligent Redaction** - Automatic PII detection and masking for data sovereignty
- 🌍 **Multi-Lingual Translation** - Technical translation with glossary preservation (English, Deutsch, 日本語)
- 📄 **PDF/A Export** - IATF-compliant document generation with QR codes
- 📊 **FMEA Risk Engine** - Automated RPN calculation and risk assessment
- 🔄 **Dynamic Approval Routing** - Logic-based workflow determined by BU, Trigger, and Duration
- 🎨 **Premium Enterprise UI** - Apple-style glassmorphism design system

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file and set your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Documentation

See the [`docs/`](./docs/) folder for comprehensive documentation:
- [Architecture Documentation](./docs/architecture.md) - System architecture and design
- [Quick Reference Guide](./docs/quick-reference.md) - Developer quick reference
- [Strategic Roadmap](./docs/strategic-roadmap.md) - Future enhancements and roadmap

## Tech Stack

- **React 19** + **TypeScript** - Modern frontend framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Google Gemini 3 Pro** - AI intelligence layer
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
