
export enum BU {
  ET = 'ET',
  EB = 'EB',
  RT = 'RT',
  RB = 'RB',
  RF = 'RF',
  RX = 'RX'
}

export enum Trigger {
  T0010 = '0010 PPAP/EMPB missing (product release)',
  T0020 = '0020 PPAP/EMPB nok (product release)',
  T0030 = '0030 Dimensional deviation',
  T0040 = '0040 Functional deviation',
  T0050 = '0050 Software faulty',
  T0060 = '0060 Specification invalid/not up to date',
  T0070 = '0070 Missing process release',
  T0080 = '0080 Process release nok'
}

export enum Duration {
  D1 = '≤ 3 months & prior to handover',
  D2 = '> 3 months ≤ 9 months & prior to handover',
  D3 = '> 9 months & prior to handover',
  D4 = '≤ 3 months & after handover',
  D5 = '> 3 months ≤ 9 months & after handover',
  D6 = '> 9 months & after handover'
}

export enum WorkflowStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  InReview = 'In Review',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Expired = 'Expired',
  Closed = 'Closed'
}

export interface RiskItem {
  id: string;
  source: 'Supplier' | 'Webasto' | 'Customer';
  description: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
}

export interface ActionItem {
  id: string;
  type: 'Immediate' | 'Corrective';
  description: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'Closed' | 'On Track' | 'Delayed';
  evidence?: string;
}

export interface ApprovalStep {
  id: string;
  role: string;
  required: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  approverName?: string;
  decisionDate?: string;
  comment?: string;
  signature?: string; // Base64 signature
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface SimilarCase {
  id: string;
  similarity: number; // 0-1
  reason: string;
}

export type DeviationType = 'Supplier' | 'Customer';

export interface DeviationRecord {
  id: string;
  deviationType: DeviationType;
  status: WorkflowStatus;
  classification: {
    language: 'English' | 'Deutsch' | '日本語';
    bu: BU;
    trigger: Trigger;
    duration: Duration;
  };
  masterData: {
    internalNo?: string;
    sapD2No?: string;
    requestDate: string;
    requestor: string;
    department: string;
    materialNo: string;
    changeLevel: string;
    furtherMaterials: boolean;
    furtherMaterialsList?: string;
    description: string;
    // Supplier-specific fields
    supplierIdent?: string;
    supplierName?: string;
    // Customer-specific fields
    customerIdent?: string;
    customerName?: string;
    customerContact?: string;
    customerProjectCode?: string;
    // Common fields
    plant: string;
    projectTitle: string;
    expirationDate: string;
    quantity?: string;
    customerInformed: boolean;
    customerReleaseNecessary: boolean;
    productSafetyRelevant: boolean;
    productSafetyComment?: string;
    attachments: Attachment[];
    slackSync?: boolean;
    teamsSync?: boolean;
  };
  details: {
    specification: string;
    deviation: string;
    translation?: string;
  };
  risks: RiskItem[];
  actions: ActionItem[];
  stock: {
    useExisting: boolean;
    explanation?: string;
    description?: string;
  };
  approvals: ApprovalStep[];
  extensions: {
    id: string;
    reason: string;
    date: string;
    newExpirationDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
  }[];
}

/**
 * AICheckResult interface for consistency and logical check results from AI.
 */
export interface AICheckResult {
  severity: 'blocking' | 'warning';
  field: string;
  message: string;
  suggestion: string;
}

export interface AIResponse {
  checks: AICheckResult[];
  riskSuggestions: {
    source: 'Supplier' | 'Webasto';
    description: string;
    s: number;
    o: number;
    d: number;
    reasoning: string;
  }[];
  opportunities: {
    category: 'quality' | 'delivery' | 'cost' | 'compliance';
    description: string;
    benefit: string;
    confidence: number;
  }[];
  similarCases: SimilarCase[];
  iatfScore: number; // 0-100
  summary: {
    executive: string[];
    sapDraft: string;
    email: string;
  };
}
