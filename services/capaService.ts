import { ActionItem, DeviationRecord, RiskItem } from '../types';

export interface EightDReport {
  meta: {
    deviationId: string;
    createdAt: string; // ISO
    plant?: string;
    supplier?: string;
    materialNo?: string;
    trigger?: string;
    duration?: string;
  };
  d1: { team: string[]; owner: string; roles: string[] };
  d2: { problemStatement: string; specification: string; deviation: string; impact: string[] };
  d3: { containmentActions: ActionItem[]; immediateActions: ActionItem[] };
  d4: { rootCauseHypothesis: string; analysisNotes: string[] };
  d5: { correctiveActions: ActionItem[] };
  d6: { implementationPlan: string[] };
  d7: { prevention: string[] };
  d8: { recognition: string };
  appendix: {
    risks: RiskItem[];
  };
}

function sanitizeLine(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function fallbackTitle(deviation: DeviationRecord): string {
  const material = deviation.masterData.materialNo ? `Material ${deviation.masterData.materialNo}` : 'Material';
  const trigger = deviation.classification.trigger ? String(deviation.classification.trigger) : 'Deviation';
  return sanitizeLine(`${trigger} – ${material}`);
}

function guessImpact(deviation: DeviationRecord): string[] {
  const impacts: string[] = [];
  if (deviation.masterData.productSafetyRelevant) impacts.push('Product safety relevant');
  if (deviation.masterData.customerReleaseNecessary) impacts.push('Customer release required');
  if (deviation.risks.some(r => r.rpn >= 125)) impacts.push('Critical FMEA risk (RPN ≥ 125) present');
  if (impacts.length === 0) impacts.push('Impact to be assessed (quality, delivery, cost, compliance)');
  return impacts;
}

function pickTeam(deviation: DeviationRecord): { team: string[]; owner: string; roles: string[] } {
  const roles = [
    'Requestor',
    'Project Manager',
    'ASQE',
    'Quality Engineer',
    'R&D',
    'ME',
  ];
  const owner = deviation.masterData.requestor || 'TBD';
  const team = [
    owner,
    'Project Manager (TBD)',
    'ASQE (TBD)',
    'Supplier Quality (TBD)',
  ];
  return { team, owner, roles };
}

function splitActions(actions: ActionItem[]): { immediate: ActionItem[]; corrective: ActionItem[] } {
  const immediate = actions.filter(a => a.type === 'Immediate');
  const corrective = actions.filter(a => a.type === 'Corrective');
  return { immediate, corrective };
}

export class CAPAService {
  generate8DFromSDA(deviation: DeviationRecord): EightDReport {
    const { immediate, corrective } = splitActions(deviation.actions);
    const team = pickTeam(deviation);

    const title = sanitizeLine(deviation.masterData.description || deviation.details.deviation || fallbackTitle(deviation));

    return {
      meta: {
        deviationId: deviation.id,
        createdAt: new Date().toISOString(),
        plant: deviation.masterData.plant || undefined,
        supplier: deviation.masterData.supplierName || undefined,
        materialNo: deviation.masterData.materialNo || undefined,
        trigger: String(deviation.classification.trigger),
        duration: String(deviation.classification.duration),
      },
      d1: team,
      d2: {
        problemStatement: title,
        specification: deviation.details.specification || 'TBD',
        deviation: deviation.details.deviation || 'TBD',
        impact: guessImpact(deviation),
      },
      d3: {
        containmentActions: immediate.slice(0, 5),
        immediateActions: immediate,
      },
      d4: {
        rootCauseHypothesis: 'TBD (use 5-Why / Ishikawa / process analysis with supplier)',
        analysisNotes: [
          'Collect evidence: measurements, photos, drawing revision, process parameters.',
          'Confirm when/where deviation was introduced (incoming, supplier process step, logistics).',
          'Validate detection gaps (inspection plan, gauge capability, sampling rate).',
        ],
      },
      d5: {
        correctiveActions: corrective,
      },
      d6: {
        implementationPlan: [
          'Assign owners + due dates for corrective actions.',
          'Implement and verify actions (effectiveness check).',
          'Update records: control plan, PFMEA, work instructions, inspection plan.',
        ],
      },
      d7: {
        prevention: [
          'Update supplier quality agreement if needed.',
          'Add/adjust SPC or capability checks for critical characteristics.',
          'Introduce poka-yoke / automated detection where feasible.',
          'Ensure lessons learned propagated to other plants/components.',
        ],
      },
      d8: {
        recognition: 'Recognize cross-functional team and supplier collaboration after verified effectiveness.',
      },
      appendix: {
        risks: deviation.risks,
      },
    };
  }

  toMarkdown(report: EightDReport): string {
    const lines: string[] = [];
    lines.push(`# 8D Report – ${report.meta.deviationId}`);
    lines.push('');
    lines.push(`- **Created**: ${report.meta.createdAt}`);
    if (report.meta.plant) lines.push(`- **Plant**: ${report.meta.plant}`);
    if (report.meta.supplier) lines.push(`- **Supplier**: ${report.meta.supplier}`);
    if (report.meta.materialNo) lines.push(`- **Material**: ${report.meta.materialNo}`);
    if (report.meta.trigger) lines.push(`- **Trigger**: ${report.meta.trigger}`);
    if (report.meta.duration) lines.push(`- **Duration**: ${report.meta.duration}`);
    lines.push('');

    lines.push('## D1 – Team');
    lines.push(`- **Owner**: ${report.d1.owner}`);
    lines.push('- **Team members**:');
    report.d1.team.forEach(m => lines.push(`  - ${m}`));
    lines.push('');

    lines.push('## D2 – Problem Description');
    lines.push(`- **Problem statement**: ${report.d2.problemStatement}`);
    lines.push(`- **Specification requirement**: ${report.d2.specification}`);
    lines.push(`- **Deviation**: ${report.d2.deviation}`);
    lines.push('- **Impact**:');
    report.d2.impact.forEach(i => lines.push(`  - ${i}`));
    lines.push('');

    function actionToLine(a: ActionItem): string {
      const due = a.dueDate ? ` (due ${a.dueDate})` : '';
      const owner = a.owner ? ` – ${a.owner}` : '';
      return `- ${sanitizeLine(a.description || 'TBD')}${owner}${due} – **${a.status}**`;
    }

    lines.push('## D3 – Containment (Immediate Actions)');
    if (report.d3.immediateActions.length === 0) {
      lines.push('- TBD');
    } else {
      report.d3.immediateActions.forEach(a => lines.push(actionToLine(a)));
    }
    lines.push('');

    lines.push('## D4 – Root Cause Analysis');
    lines.push(`- **Hypothesis**: ${report.d4.rootCauseHypothesis}`);
    lines.push('- **Notes**:');
    report.d4.analysisNotes.forEach(n => lines.push(`  - ${n}`));
    lines.push('');

    lines.push('## D5 – Corrective Actions');
    if (report.d5.correctiveActions.length === 0) {
      lines.push('- TBD');
    } else {
      report.d5.correctiveActions.forEach(a => lines.push(actionToLine(a)));
    }
    lines.push('');

    lines.push('## D6 – Implementation & Verification');
    report.d6.implementationPlan.forEach(s => lines.push(`- ${s}`));
    lines.push('');

    lines.push('## D7 – Prevent Recurrence');
    report.d7.prevention.forEach(s => lines.push(`- ${s}`));
    lines.push('');

    lines.push('## D8 – Recognition');
    lines.push(`- ${report.d8.recognition}`);
    lines.push('');

    return lines.join('\n');
  }
}

