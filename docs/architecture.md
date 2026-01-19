# Webasto SDA - Architectural Documentation

## Overview

This application is a **High-Fidelity Enterprise Quality Management System (QMS)** specifically architected for the **Webasto Supplier Deviation Approval (SDA)** process. It modernizes and automates the complex workflow required for **IATF 16949 compliance** in automotive manufacturing.

**Project Name:** AI:PPROVAL  
**Purpose:** Manage supplier deviations when vendors cannot meet exact technical specifications (dimensional, functional, or software) and require temporary allowances.

---

## 1. Core Purpose & Domain

### 1.1 Supplier Deviation Approval (SDA)

When a vendor cannot meet exact technical specifications, they request a temporary allowance (SDA) through this system. The application manages the entire lifecycle from submission to approval/rejection.

### 1.2 Compliance Framework

- **IATF 16949 Standards**: Strictly adheres to automotive quality management system requirements
- **Audit Readiness**: Automated scoring and documentation validation
- **Traceability**: Complete audit trail of all decisions and approvals

### 1.3 Risk Engine (FMEA Logic)

The system implements **Failure Mode and Effects Analysis (FMEA)** methodology:

- **RPN Calculation**: Risk Priority Number = Severity (S) × Occurrence (O) × Detection (D)
- **Critical Threshold**: RPN ≥ 125 requires immediate attention and mandatory containment measures
- **Risk Sources**: Classified as either "Supplier" or "Webasto" origin
- **Visual Indicators**: High-risk scores (RPN ≥ 125) are highlighted in red throughout the UI

### 1.4 Approval Matrix

Dynamic routing logic determines required approvers based on:

- **Business Unit (BU)**: ET, EB, RT, RB, RF, RX
- **Trigger Code**: Standardized codes (0010-0080) classifying deviation nature
- **Duration Category**: 
  - D1: ≤ 3 months & prior to handover
  - D2: > 3 months ≤ 9 months & prior to handover
  - D3: > 9 months & prior to handover
  - D4: ≤ 3 months & after handover
  - D5: > 3 months ≤ 9 months & after handover
  - D6: > 9 months & after handover

**Routing Rules:**
- Longer durations (> 9 months) require Plant Director approval
- Product Safety Relevant deviations require Product Safety Officer
- Short prior deviations (D1) route to R&D responsible; longer routes to R&D Director

---

## 2. Tech Stack & Design System

### 2.1 Frontend Stack

- **React 19.2.3**: Latest React with modern hooks and patterns
- **TypeScript 5.8.2**: Full type safety across the codebase
- **Vite 6.2.0**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling with custom design tokens

### 2.2 UI/UX Paradigm

**"Premium Enterprise" Aesthetic** combining:

- **Apple-like Glassmorphism**: 
  - `backdrop-blur` effects
  - Radial gradients
  - Semi-transparent overlays
  - `.glass` and `.glass-dark` utility classes

- **Professional Industrial Data Density**:
  - High information density without clutter
  - Clear visual hierarchy
  - Responsive grid layouts

### 2.3 Typography System

- **Labels**: High-contrast, uppercase with `tracking-widest` (0.2em)
- **Data**: Semi-bold Inter font family
- **Hierarchy**: 
  - Headers: `font-extrabold` or `font-black`
  - Body: `font-semibold` or `font-bold`
  - Meta: `font-medium` with reduced opacity

### 2.4 Color Palette

- **Primary Blue**: `#007aff` (Apple-style system blue)
- **Dark Blue**: `#00305d` (Webasto brand)
- **Status Colors**:
  - Success: `emerald-500`
  - Warning: `amber-500`
  - Critical: `red-600`
  - Info: `slate-400`

### 2.5 Component Architecture

**Modular Structure:**

- `Layout.tsx`: Persistent sidebar navigation and glass-effect header
- `RiskTable.tsx`: FMEA risk management with S/O/D inputs
- `ActionTable.tsx`: Corrective and immediate action tracking
- `AIAssistant.tsx`: AI analysis panel with redaction mode
- `AnalyticsCharts.tsx`: Performance visualization
- `ActivityFeed.tsx`: Real-time activity stream

---

## 3. Intelligence Layer (AI:PPROVAL)

### 3.1 AI Integration

**Service**: `services/geminiService.ts`  
**Model**: Google Gemini 3 Pro Preview  
**API**: `@google/genai` package

### 3.2 Virtual Quality Auditor Role

The AI acts as a sophisticated quality auditor performing:

1. **Completeness & Logical Consistency Checks**
   - Scans all fields for missing or inconsistent data
   - Validates relationships between fields
   - Identifies blocking issues vs. warnings

2. **Risk Identification**
   - Proposes FMEA risks with technical reasoning
   - Suggests Severity, Occurrence, Detection values
   - Classifies risk source (Supplier vs. Webasto)

3. **Opportunity Analysis**
   - Suggests quality, delivery, cost, or compliance improvements
   - Provides confidence scores
   - Links opportunities to deviation context

4. **Similarity Search**
   - Simulates historical database lookup
   - Returns 2-3 similar past cases with similarity scores
   - Provides reasoning for matches

5. **IATF 16949 Compliance Scoring**
   - Calculates audit readiness score (0-100)
   - Based on documentation completeness, containment logic, and corrective action evidence
   - Flags compliance gaps

6. **Executive Summary & Artifacts**
   - Generates executive summary bullet points
   - Creates SAP D2 draft documentation
   - Generates email templates for stakeholders

### 3.3 Data Safety (Redaction Mode)

**PII Protection**: Before sending data to the LLM, the system can redact:
- Requestor names → `[REDACTED]`
- Supplier names → `[REDACTED]`

This ensures compliance with Webasto data governance policies and prevents sensitive corporate identifiers from being transmitted to external cloud models.

### 3.4 Response Schema

The AI returns structured JSON matching the `AIResponse` interface:
- `checks`: Array of validation results
- `riskSuggestions`: FMEA risk proposals
- `opportunities`: Improvement suggestions
- `similarCases`: Historical matches
- `iatfScore`: Compliance score
- `summary`: Executive summary and artifacts

---

## 4. Codebase Organization

### 4.1 File Structure

```
D_AI_pproval/
├── App.tsx                 # Main state machine & routing logic
├── index.tsx               # React entry point
├── types.ts               # Domain model (Source of Truth)
├── constants.tsx          # Webasto master data & tooltips
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── components/
│   ├── Layout.tsx         # Sidebar & header navigation
│   ├── RiskTable.tsx      # FMEA risk management
│   ├── ActionTable.tsx    # Corrective action tracking
│   ├── AIAssistant.tsx    # AI analysis panel
│   ├── AnalyticsCharts.tsx # Performance charts
│   └── ActivityFeed.tsx   # Activity stream
└── services/
    └── geminiService.ts   # Gemini AI integration
```

### 4.2 Key Files

#### `App.tsx` - Main State Machine

**Responsibilities:**
- Tab navigation state (`activeTab`)
- Complex "New Deviation" form state (`deviation`)
- AI analysis state (`aiAnalysis`, `loadingAI`)
- Approval queue state
- Admin section state

**Critical Functions:**
- `calculateRouting()`: Core workflow engine that determines approval steps based on classification and safety flags
- `updateClassification()`: Updates classification and recalculates routing
- `updateMasterData()`: Updates master data and recalculates routing if safety relevance changes
- `initialDeviation()`: Creates new deviation record with default values

**⚠️ Important**: The `calculateRouting()` function must be kept in sync with `Duration` and `Trigger` types. Any changes to routing logic should be reflected here.

#### `types.ts` - Domain Model (Source of Truth)

**Core Enums:**
- `BU`: Business Units (ET, EB, RT, RB, RF, RX)
- `Trigger`: Standardized trigger codes (T0010-T0080)
- `Duration`: Duration categories (D1-D6)
- `WorkflowStatus`: Lifecycle states

**Core Interfaces:**
- `DeviationRecord`: Complete deviation data structure
- `RiskItem`: FMEA risk with S/O/D values
- `ActionItem`: Corrective or immediate action
- `ApprovalStep`: Approval workflow step
- `AIResponse`: Structured AI analysis response

**⚠️ Important**: Any change to the workflow or risk logic starts here. This file defines the contract for all data structures.

#### `constants.tsx` - Master Data & Configuration

**Contains:**
- `PLANTS`: Webasto manufacturing sites
- `BUs`, `TRIGGERS`, `DURATIONS`: Enum value arrays
- `SEVERITY_MAP`: Risk severity styling
- `FIELD_DESCRIPTIONS`: Comprehensive tooltips for form fields

**Usage**: Referenced throughout the UI for dropdowns, tooltips, and validation.

#### `components/Layout.tsx` - Navigation Structure

**Features:**
- Persistent sidebar with glassmorphism styling
- Responsive navigation (collapsed on mobile)
- Active tab highlighting
- System status indicator
- User profile section

**Navigation Tabs:**
1. Dashboard
2. New Deviation
3. Approvals (with badge count)
4. Compliance
5. Archive
6. Admin

---

## 5. Key Business Logic

### 5.1 Approval Routing Logic

**Location**: `App.tsx` → `calculateRouting()`

**Algorithm:**
1. Always includes: Requestor, Project Manager
2. R&D level determined by duration:
   - D1 (short prior): "R&D responsible"
   - D2-D6: "R&D Director / Business Line"
3. ME level determined by duration:
   - D1: "ME series"
   - D2-D6: "Head of ME"
4. Always includes: ASQE (Buy Part), Quality Engineer
5. Plant Director required for:
   - D3, D4, D5, D6 (longer durations)
6. Product Safety Officer required if:
   - `productSafetyRelevant === true`

**⚠️ Critical**: This logic must match Webasto's official approval matrix. Any changes require validation against corporate policy.

### 5.2 RPN Calculation & Visibility

**Formula**: `RPN = Severity × Occurrence × Detection`

**Thresholds:**
- **Critical**: RPN ≥ 125 (red highlighting required)
- **Medium**: RPN 60-124 (amber highlighting)
- **Low**: RPN < 60 (standard styling)

**Visual Requirements:**
- All RPN displays must highlight scores ≥ 125 in red
- Risk tables must show S/O/D breakdown
- Dashboard must surface high-risk items prominently

### 5.3 Admin Governance

**Three Sub-Sections:**

1. **User IAM & Directory**
   - User management
   - Role assignment (Global Admin, Approver, Requestor, etc.)
   - BU scope configuration
   - Activity tracking

2. **Approval Routing Matrix**
   - Policy configuration
   - Routing rule editor
   - Matrix simulator for testing scenarios
   - Policy audit log

3. **AI Governance & Tuning**
   - Risk alert threshold (RPN baseline)
   - Compliance sensitivity (LAX/BALANCED/STRICT)
   - Knowledge context window configuration
   - Model connectivity testing
   - Data sovereignty policy enforcement

### 5.4 Form State Management

**Multi-Tab Form Structure:**
1. Classification (Language, BU, Trigger, Duration)
2. Master Data (Material, Supplier, Plant, Dates, Safety flags)
3. Details (Specification, Deviation description)
4. Risks (FMEA risk table)
5. Actions (Corrective and immediate actions)
6. Approvals (Generated routing preview)

**State Updates:**
- Classification changes → Recalculate routing
- Safety relevance changes → Recalculate routing
- All other fields → Direct state update

---

## 6. Development Guidelines

### 6.1 When Making Changes

**Reference these terms to maintain context:**
- "IATF compliance"
- "FMEA logic"
- "Webasto design system"
- "RPN calculation"
- "Approval routing"

### 6.2 Code Style

- **Functional Components**: Use React hooks, avoid classes
- **TypeScript**: Strict typing, prefer interfaces over types
- **Tailwind**: Use utility classes, maintain design system consistency
- **State Management**: Centralized in `App.tsx` for form state, local for UI state

### 6.3 Testing Considerations

- **Routing Logic**: Test all Duration/Trigger combinations
- **RPN Calculations**: Verify S×O×D math and threshold highlighting
- **AI Integration**: Test with redaction mode enabled/disabled
- **Responsive Design**: Verify mobile/tablet/desktop layouts

### 6.4 Environment Setup

**Required Environment Variables:**
- `GEMINI_API_KEY`: Google Gemini API key for AI features

**Configuration:**
- Port: 3000 (configurable in `vite.config.ts`)
- Host: 0.0.0.0 (accessible from network)

---

## 7. Future Considerations

### 7.1 Potential Enhancements

- **ERP Integration**: Live SAP ERP telemetry (currently mocked)
- **Real-time Collaboration**: Slack/Teams sync (UI exists, backend pending)
- **Historical Database**: Actual similarity search against past deviations
- **PDF Generation**: Automated report generation
- **Multi-language Support**: Full i18n for Deutsch and 日本語

### 7.2 Scalability

- **State Management**: Consider Redux/Zustand if state complexity grows
- **API Layer**: Extract API calls to dedicated service layer
- **Component Library**: Consider extracting reusable components to shared package
- **Testing**: Add unit tests for routing logic and RPN calculations

---

## 8. Compliance & Governance

### 8.1 Data Sovereignty

- AI redaction mode must be used for any external API calls containing PII
- All data processing must comply with Webasto data governance policies
- Model behavior is limited by Webasto Data Sovereignty policies

### 8.2 Audit Requirements

- All approval decisions must be logged with timestamps
- Signature capture (Base64) for approvals
- Complete audit trail of state changes
- IATF score tracking for compliance reporting

---

## 9. References

- **IATF 16949**: Automotive Quality Management System Standard
- **FMEA**: Failure Mode and Effects Analysis methodology
- **Webasto Corporate Standards**: Internal approval matrix and routing policies
- **Gemini API**: [Google AI Studio](https://ai.studio)

---

**Last Updated**: 2025-01-27  
**Maintainer**: Webasto Quality Engineering Team
