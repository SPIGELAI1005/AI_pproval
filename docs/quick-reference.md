# Quick Reference Guide

## Running the Application

```bash
# Install dependencies
npm install

# Create .env.local with your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Default URL**: http://localhost:3000

---

## Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `App.tsx` | Main state machine, routing logic, form state |
| `types.ts` | **Source of Truth** - All domain models |
| `constants.tsx` | Master data (Plants, BUs, Triggers), tooltips |
| `components/Layout.tsx` | Navigation sidebar and header |
| `services/geminiService.ts` | AI integration with Gemini 3 Pro |
| `components/RiskTable.tsx` | FMEA risk management (S/O/D inputs) |
| `components/ActionTable.tsx` | Corrective action tracking |

---

## Critical Business Logic

### Approval Routing (`calculateRouting` in `App.tsx`)

**Always Required:**
- Requestor
- Project Manager

**Duration-Based Routing:**
- **D1** (≤3m, prior): R&D responsible → ME series
- **D2-D6**: R&D Director → Head of ME

**Additional Approvers:**
- Plant Director: Required for D3, D4, D5, D6
- Product Safety Officer: Required if `productSafetyRelevant === true`

### RPN Calculation

```typescript
RPN = Severity × Occurrence × Detection
```

**Thresholds:**
- 🔴 **Critical**: RPN ≥ 125 (red highlight required)
- 🟡 **Medium**: RPN 60-124
- 🟢 **Low**: RPN < 60

---

## Design System Tokens

### Colors
- Primary: `#007aff` (Apple system blue)
- Brand: `#00305d` (Webasto dark blue)
- Success: `emerald-500`
- Warning: `amber-500`
- Critical: `red-600`

### Typography
- Labels: `text-[10px] font-black uppercase tracking-widest`
- Headers: `font-extrabold` or `font-black`
- Data: `font-semibold` or `font-bold`

### Glass Effects
- `.glass`: Light glassmorphism (white/transparent)
- `.glass-dark`: Dark glassmorphism (for sidebar)

---

## Common Patterns

### Form Fields
```tsx
<FormField label="Field Name" description={FIELD_DESCRIPTIONS.fieldName}>
  <input className="apple-input" />
</FormField>
```

### Buttons
```tsx
<button className="apple-btn-primary">Primary Action</button>
<button className="apple-btn-secondary">Secondary Action</button>
```

### Status Badges
```tsx
<span className="text-[10px] font-black px-2 py-1 rounded uppercase bg-emerald-500 text-white">
  Approved
</span>
```

---

## AI Integration

### Redaction Mode
Before sending to AI, redact PII:
- Requestor name → `[REDACTED]`
- Supplier name → `[REDACTED]`

### AI Response Structure
```typescript
{
  checks: AICheckResult[],
  riskSuggestions: RiskSuggestion[],
  opportunities: Opportunity[],
  similarCases: SimilarCase[],
  iatfScore: number, // 0-100
  summary: {
    executive: string[],
    sapDraft: string,
    email: string
  }
}
```

---

## Domain Model Quick Reference

### Business Units (BU)
- `ET`, `EB`, `RT`, `RB`, `RF`, `RX`

### Duration Categories
- `D1`: ≤ 3 months & prior to handover
- `D2`: > 3 months ≤ 9 months & prior to handover
- `D3`: > 9 months & prior to handover
- `D4`: ≤ 3 months & after handover
- `D5`: > 3 months ≤ 9 months & after handover
- `D6`: > 9 months & after handover

### Trigger Codes
- `T0010`: PPAP/EMPB missing (product release)
- `T0020`: PPAP/EMPB nok (product release)
- `T0030`: Dimensional deviation
- `T0040`: Functional deviation
- `T0050`: Software faulty
- `T0060`: Specification invalid/not up to date
- `T0070`: Missing process release
- `T0080`: Process release nok

### Workflow Status
- `Draft`, `Submitted`, `InReview`, `Approved`, `Rejected`, `Expired`, `Closed`

---

## When Making Changes

### ⚠️ Critical Areas

1. **Routing Logic** (`calculateRouting`)
   - Must match Webasto corporate policy
   - Test all Duration/Trigger combinations
   - Update when approval matrix changes

2. **RPN Display**
   - Always highlight RPN ≥ 125 in red
   - Show S/O/D breakdown in risk tables
   - Surface high-risk items on dashboard

3. **Type Definitions** (`types.ts`)
   - Any workflow change starts here
   - Keep enums in sync with constants
   - Maintain interface contracts

4. **AI Safety**
   - Always use redaction mode for PII
   - Validate API key configuration
   - Handle API errors gracefully

---

## Testing Checklist

- [ ] Routing logic for all Duration categories
- [ ] RPN calculation and threshold highlighting
- [ ] AI integration with redaction mode
- [ ] Form state persistence
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Approval workflow state transitions
- [ ] Admin section functionality

---

## Troubleshooting

### AI Not Working
- Check `GEMINI_API_KEY` in `.env.local`
- Verify API key is valid
- Check browser console for errors
- Ensure redaction mode is configured correctly

### Routing Not Updating
- Check `calculateRouting()` function
- Verify `updateClassification()` and `updateMasterData()` are called
- Ensure Duration/Trigger enums match constants

### Styling Issues
- Verify Tailwind classes are correct
- Check for conflicting CSS
- Ensure glass effects have proper backdrop-blur

---

**See [architecture.md](./architecture.md) for detailed documentation.**
