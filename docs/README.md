# Webasto SDA Documentation

Welcome to the architectural documentation for the **Webasto Supplier Deviation Approval (SDA)** system.

## Documentation Index

### 📘 [Architecture Documentation](./architecture.md)
Comprehensive guide covering:
- Core purpose & domain (SDA workflow, IATF compliance, FMEA logic)
- Tech stack & design system (React, TypeScript, Tailwind, glassmorphism)
- Intelligence layer (AI:PPROVAL with configurable AI providers)
- Codebase organization (file structure, key components)
- Key business logic (approval routing, RPN calculation)
- Development guidelines
- Compliance & governance

**Read this first** to understand the system architecture and design principles.

### ⚡ [Quick Reference Guide](./quick-reference.md)
Fast lookup for:
- Running the application
- Key files and their purposes
- Critical business logic (routing, RPN thresholds)
- Design system tokens
- Common code patterns
- Domain model quick reference
- Troubleshooting tips

**Use this** for day-to-day development tasks and quick lookups.

### 🚀 [Strategic Roadmap](./strategic-roadmap.md)
Comprehensive plan to transform the platform into a **World-Class Intelligent Quality Operating System**:
- 15 strategic improvements across Architecture, UX, and AI-Integration
- Implementation phases (3 phases over 9 months)
- Technical requirements and implementation details
- Priority matrix and success metrics
- Risk mitigation strategies

**Review this** to understand the future vision and planned enhancements.

### 📋 [Roadmap Summary](./roadmap-summary.md)
Executive summary of the strategic roadmap:
- High-level overview of all 15 improvements
- Phase-by-phase breakdown with priorities
- Expected ROI and success metrics
- Quick reference for stakeholders

**Use this** for executive presentations and quick overviews.

---

## Getting Started

1. **New to the project?** Start with [architecture.md](./architecture.md) to understand the system.
2. **Need to make a change?** Check [quick-reference.md](./quick-reference.md) for patterns and critical areas.
3. **Working on routing logic?** See the `calculateRouting()` section in architecture.md.
4. **Adding AI features?** Review the Intelligence Layer section in architecture.md.

---

## Key Concepts

- **SDA**: Supplier Deviation Approval - temporary allowance when vendors cannot meet specifications
- **SDA/CDA**: Supports both Supplier and Customer Deviation Approval workflows
- **ISO 9001 & IATF 16949**: Dual-standard compliance tracking and reporting
- **FMEA**: Failure Mode and Effects Analysis - risk calculation methodology
- **RPN**: Risk Priority Number (S × O × D) - critical threshold is 125
- **AI:PPROVAL / "I A:M Q"**: The AI-powered quality auditor feature (chat and voice)

---

## Contributing

When making changes:
1. Reference "IATF compliance" and "FMEA logic" to maintain technical accuracy
2. Keep routing logic in sync with Webasto corporate policy
3. Always highlight RPN ≥ 125 in red
4. Use redaction mode for AI features involving PII
5. Update this documentation if you change architectural patterns

---

**Last Updated**: 2025-01-28  
**Current Version**: 2.1.0
