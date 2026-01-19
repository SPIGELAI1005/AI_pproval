
import React from 'react';
import { BU, Trigger, Duration } from './types';

export const PLANTS = [
  'Stockdorf (HQ)',
  'Neubrandenburg',
  'Schierling',
  'Utting',
  'Arad',
  'Liberec',
  'Bratislava',
  'Detroit',
  'Shanghai',
  'Yokohama'
];

export const BUs = Object.values(BU);
export const TRIGGERS = Object.values(Trigger);
export const DURATIONS = Object.values(Duration);

export const SEVERITY_MAP = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

export const FIELD_DESCRIPTIONS = {
  anonymize: "Redacts Requestor and Supplier names from AI inputs. Ensures no PII or sensitive corporate identifiers are transmitted to external cloud models, maintaining Webasto data governance.",
  productSafety: "Flags the deviation as critical for product safety. This triggers a mandatory approval step by the Group Product Safety Officer and often requires D/TL documentation.",
  trigger: "Standardized Webasto trigger codes (e.g., 0010, 0030). These classify the nature of the deviation for systemic tracking and reporting.",
  duration: "Buckets determining the risk level and required approval level. Longer durations or deviations after series handover require higher management sign-off.",
  iatfScore: "Automated audit readiness score based on documentation completeness, containment logic, and corrective action evidence required by IATF 16949 standards.",
  rpn: "Risk Priority Number (Severity × Occurrence × Detection). Scores above 125 are considered high risk and must have immediate containment measures defined.",
  bu: "The Webasto Business Unit responsible for the commercial and technical ownership of the part or process.",
  materialNo: "The unique Webasto part identifier. AI uses this to check against historical deviation trends for the same component group.",
  language: "Select the primary language for the deviation report. The system uses this to set the locale for generated PDF reports and AI communication templates.",
  supplierName: "The legal entity name of the vendor. AI uses this for historical risk lookup. Ensure consistency with the Supplier Ident No.",
  plant: "The Webasto manufacturing site affected by this deviation. This determines the default Plant Director in the approval routing.",
  expirationDate: "The last valid day for this deviation. The system validates this against the 'Duration Category' rules (e.g., max 3 months for some categories).",
  specification: "Quote the exact requirement from the technical drawing or standard. Be as specific as possible (e.g., 'Drawing 123, Section A, Dim 4.5 +/- 0.1').",
  deviationDetails: "Explain exactly how the current part/process differs from the specification. Reference measurements or attach photos for clarity.",
  sync: "Enables real-time status notifications to project collaboration channels. Highly recommended for high-priority projects."
};
