import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import RiskTable from './components/RiskTable';
import ActionTable from './components/ActionTable';
import AIAssistant from './components/AIAssistant';
import ActivityFeed from './components/ActivityFeed';
import AnalyticsCharts from './components/AnalyticsCharts';
import { 
  DeviationRecord, WorkflowStatus, BU, Trigger, Duration, 
  ApprovalStep, AIResponse 
} from './types';
import { BUs, TRIGGERS, DURATIONS, PLANTS, FIELD_DESCRIPTIONS } from './constants';
import { AIService } from './services/aiService';
import { TranslationService, SupportedLanguage } from './services/translationService';
import { PDFExportService } from './services/pdfExportService';
import { ConflictDetectionService, ConflictAlert } from './services/conflictDetectionService';
import { ConflictAlertsPanel } from './components/ConflictAlert';
import FAQ from './components/FAQ';
import EightDGenerator from './components/EightDGenerator';
import VisionUpload from './components/VisionUpload';
import ApprovalTimeline from './components/ApprovalTimeline';
import AdaptiveCardPreview from './components/AdaptiveCardPreview';
import { AdaptiveCardsService } from './services/adaptiveCardsService';
import RiskHeatmap from './components/RiskHeatmap';
import OfflineIndicator from './components/OfflineIndicator';
import { OfflineService } from './services/offlineService';
import VoiceAssistant from './components/VoiceAssistant';
import GlobalAIPanel from './components/GlobalAIPanel';
import ConfirmationModal from './components/ConfirmationModal';

function getStatusPill(status: WorkflowStatus): { label: string; className: string } {
  const base =
    'px-6 py-3 rounded-full border text-[10px] font-black uppercase transition-colors';

  // Map non-requested statuses into the closest UX bucket
  if (status === WorkflowStatus.Expired) {
    return {
      label: 'Overdue',
      className: `${base} bg-purple-200 dark:bg-purple-900/25 border-purple-400 dark:border-purple-800 text-purple-950 dark:text-purple-300 shadow-sm`,
    };
  }

  const map: Record<WorkflowStatus, { label: string; className: string }> = {
    [WorkflowStatus.Draft]: {
      label: 'Draft',
      className: `${base} bg-amber-200 dark:bg-amber-900/25 border-amber-400 dark:border-amber-800 text-amber-950 dark:text-amber-300 shadow-sm`,
    },
    [WorkflowStatus.Rejected]: {
      label: 'Rejected',
      className: `${base} bg-red-200 dark:bg-red-900/25 border-red-400 dark:border-red-800 text-red-950 dark:text-red-300 shadow-sm`,
    },
    [WorkflowStatus.Approved]: {
      label: 'Approved',
      className: `${base} bg-emerald-200 dark:bg-emerald-900/25 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 shadow-sm`,
    },
    [WorkflowStatus.InReview]: {
      label: 'In Review',
      className: `${base} bg-blue-200 dark:bg-blue-900/25 border-blue-400 dark:border-blue-800 text-blue-950 dark:text-blue-300 shadow-sm`,
    },
    // Treat Submitted as In Review (blue) in UI
    [WorkflowStatus.Submitted]: {
      label: 'In Review',
      className: `${base} bg-blue-200 dark:bg-blue-900/25 border-blue-400 dark:border-blue-800 text-blue-950 dark:text-blue-300 shadow-sm`,
    },
    // Expired handled above to label as Overdue
    [WorkflowStatus.Expired]: {
      label: 'Overdue',
      className: `${base} bg-purple-200 dark:bg-purple-900/25 border-purple-400 dark:border-purple-800 text-purple-950 dark:text-purple-300 shadow-sm`,
    },
    [WorkflowStatus.Closed]: {
      label: 'Closed',
      className: `${base} bg-slate-300 dark:bg-slate-800/60 border-slate-400 dark:border-slate-700 text-slate-950 dark:text-slate-300 shadow-sm`,
    },
  };

  return map[status] ?? {
    label: String(status),
    className: `${base} bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300`,
  };
}

const InfoIcon = ({ text }: { text?: string }) => {
  if (!text) return null;
  return (
    <div className="relative group/info inline-block align-middle ml-1.5">
      <i className="fa-solid fa-circle-info text-[10px] ui-text-tertiary hover:text-[#007aff] transition-colors cursor-help"></i>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[100] pointer-events-none">
        <div className="text-[10px] font-bold ui-text-primary leading-relaxed mb-1 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 text-left">Information</div>
        <p className="text-[10px] font-medium ui-text-secondary leading-relaxed text-left normal-case">
          {text}
        </p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-slate-800"></div>
      </div>
    </div>
  );
};

const FormField = ({ label, children, className = "", description }: { label: string; children?: React.ReactNode; className?: string; description?: string }) => (
  <div className={`space-y-1.5 group min-w-0 ${className}`}>
    <div className="flex items-center px-1">
      <label className="text-[10px] font-black ui-label block group-focus-within:text-[#007aff]">
        {label}
      </label>
      <InfoIcon text={description} />
    </div>
    <div className="relative">
      {children}
    </div>
  </div>
);

// Mock Data - Expanded approvals list with both Supplier and Customer
const MOCK_APPROVALS = [
  { 
    id: 'DAI_ET-2026-8816', 
    title: 'Housing dimensional deviation', 
    supplier: 'Bosch Global', 
    customer: '',
    deviationType: 'Supplier' as const,
    bu: 'ET', 
    rpn: 150, 
    urgency: 'Critical', 
    pendingDays: 2, 
    step: 'R&D Director Review',
    material: '882-103-X',
    status: WorkflowStatus.InReview,
    requestor: 'Marcus Weber',
    submittedDate: '2026-01-26'
  },
  { 
    id: 'DAI_RB-2026-1102', 
    title: 'Software logic mismatch in control unit', 
    supplier: 'Continental AG', 
    customer: '',
    deviationType: 'Supplier' as const,
    bu: 'RB', 
    rpn: 80, 
    urgency: 'Medium', 
    pendingDays: 4, 
    step: 'Project Manager Sign-off',
    material: 'RB-X102-S',
    status: WorkflowStatus.InReview,
    requestor: 'Lena Schmidt',
    submittedDate: '2026-01-24'
  },
  { 
    id: 'DAI_RX-2026-0552', 
    title: 'PPAP Documentation Missing (Samples only)', 
    supplier: 'ZF Friedrichshafen', 
    customer: '',
    deviationType: 'Supplier' as const,
    bu: 'RX', 
    rpn: 42, 
    urgency: 'Low', 
    pendingDays: 1, 
    step: 'Quality Engineer Approval',
    material: 'RX-PZ-991',
    status: WorkflowStatus.InReview,
    requestor: 'Hans Müller',
    submittedDate: '2026-01-27'
  },
  {
    id: 'DAI_CUST-2026-001',
    title: 'Material specification change request',
    supplier: '',
    customer: 'BMW Group',
    deviationType: 'Customer' as const,
    bu: 'ET',
    rpn: 125,
    urgency: 'Critical',
    pendingDays: 3,
    step: 'Product Safety Officer Review',
    material: 'CUST-BMW-445',
    status: WorkflowStatus.InReview,
    requestor: 'Dr. Müller (BMW)',
    submittedDate: '2026-01-25'
  },
  {
    id: 'DAI_CUST-2026-002',
    title: 'Dimensional tolerance modification',
    supplier: '',
    customer: 'Mercedes-Benz',
    deviationType: 'Customer' as const,
    bu: 'RB',
    rpn: 95,
    urgency: 'Medium',
    pendingDays: 2,
    step: 'R&D Director Review',
    material: 'CUST-MB-889',
    status: WorkflowStatus.InReview,
    requestor: 'Quality Lead MB',
    submittedDate: '2026-01-26'
  },
  {
    id: 'DAI_EB-2026-0321',
    title: 'Battery cell capacity deviation',
    supplier: 'LG Chem',
    customer: '',
    deviationType: 'Supplier' as const,
    bu: 'EB',
    rpn: 110,
    urgency: 'High',
    pendingDays: 5,
    step: 'Head of ME Review',
    material: 'EB-772-L',
    status: WorkflowStatus.InReview,
    requestor: 'Yuki Tanaka',
    submittedDate: '2026-01-23'
  }
];

const MOCK_HISTORY = [
  // Supplier deviations
  { id: 'DAI_ET-2025-1105', material: '882-103-X', supplier: 'Bosch Global', customer: '', BU: BU.ET, rpn: 45, date: '2025-11-12', status: WorkflowStatus.Approved, deviationType: 'Supplier' as const, approver: 'Marcus Weber', cycleTime: 3 },
  { id: 'DAI_RB-2025-0988', material: 'RB-X102-S', supplier: 'Continental AG', customer: '', BU: BU.RB, rpn: 110, date: '2025-10-05', status: WorkflowStatus.Approved, deviationType: 'Supplier' as const, approver: 'Lena Schmidt', cycleTime: 5 },
  { id: 'DAI_RX-2025-0441', material: 'RX-PZ-991', supplier: 'ZF Friedrichshafen', customer: '', BU: BU.RX, rpn: 160, date: '2025-09-20', status: WorkflowStatus.Rejected, deviationType: 'Supplier' as const, approver: 'Hans Müller', cycleTime: 7 },
  { id: 'DAI_EB-2025-3102', material: 'EB-772-L', supplier: 'LG Chem', customer: '', BU: BU.EB, rpn: 35, date: '2025-08-15', status: WorkflowStatus.Approved, deviationType: 'Supplier' as const, approver: 'Yuki Tanaka', cycleTime: 2 },
  { id: 'DAI_ET-2025-1201', material: 'ET-445-M', supplier: 'Valeo', customer: '', BU: BU.ET, rpn: 125, date: '2025-12-01', status: WorkflowStatus.Approved, deviationType: 'Supplier' as const, approver: 'Marcus Weber', cycleTime: 4 },
  { id: 'DAI_RB-2025-0995', material: 'RB-889-P', supplier: 'Hella GmbH', customer: '', BU: BU.RB, rpn: 95, date: '2025-10-18', status: WorkflowStatus.Approved, deviationType: 'Supplier' as const, approver: 'Lena Schmidt', cycleTime: 3 },
  // Customer deviations
  { id: 'DAI_CUST-2025-001', material: 'CUST-BMW-445', supplier: '', customer: 'BMW Group', BU: BU.ET, rpn: 85, date: '2025-11-20', status: WorkflowStatus.Approved, deviationType: 'Customer' as const, approver: 'Dr. Müller (BMW)', cycleTime: 6 },
  { id: 'DAI_CUST-2025-002', material: 'CUST-MB-889', supplier: '', customer: 'Mercedes-Benz', BU: BU.RB, rpn: 120, date: '2025-11-15', status: WorkflowStatus.InReview, deviationType: 'Customer' as const, approver: 'Pending', cycleTime: 4 },
  { id: 'DAI_CUST-2025-003', material: 'CUST-VW-223', supplier: '', customer: 'Volkswagen AG', BU: BU.RX, rpn: 155, date: '2025-11-10', status: WorkflowStatus.Approved, deviationType: 'Customer' as const, approver: 'Quality Lead VW', cycleTime: 8 },
  { id: 'DAI_CUST-2025-004', material: 'CUST-AUDI-556', supplier: '', customer: 'Audi AG', BU: BU.ET, rpn: 72, date: '2025-10-25', status: WorkflowStatus.Approved, deviationType: 'Customer' as const, approver: 'Audi Quality Team', cycleTime: 3 },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deviationType, setDeviationType] = useState<'Supplier' | 'Customer'>('Supplier');
  const [deviation, setDeviation] = useState<DeviationRecord>(initialDeviation());
  const [aiAnalysis, setAIAnalysis] = useState<AIResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [redactionMode, setRedactionMode] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('classification');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [isDecisionSubmitting, setIsDecisionSubmitting] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<{
    urgency: 'all' | 'Critical' | 'High' | 'Medium' | 'Low';
    bu: BU | 'all';
    search: string;
  }>({
    urgency: 'all',
    bu: 'all',
    search: ''
  });
  const [adminSection, setAdminSection] = useState<'users' | 'matrix' | 'ai' | 'settings'>('users');
  const [translating, setTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{ confidence: number; termsPreserved: string[] } | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [conflictAlerts, setConflictAlerts] = useState<ConflictAlert[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const conflictDetectionService = React.useMemo(() => new ConflictDetectionService(), []);
  const conflictCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const offlineService = React.useMemo(() => new OfflineService(), []);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'submit' | null;
  }>({ isOpen: false, type: null });
  const [recentActions, setRecentActions] = useState<Array<{
    action: string;
    timestamp: Date;
    type: 'save' | 'submit';
  }>>([]);
  const [archiveFilter, setArchiveFilter] = useState<{
    status: WorkflowStatus | 'all';
    bu: BU | 'all';
    dateRange: 'all' | '3m' | '6m' | '12m';
    search: string;
  }>({
    status: 'all',
    bu: 'all',
    dateRange: 'all',
    search: '',
  });

  // Initialize offline service
  useEffect(() => {
    offlineService.initialize().catch(console.error);
  }, [offlineService]);

  function calculateRouting(classification: DeviationRecord['classification'], safety: boolean): ApprovalStep[] {
    const steps: ApprovalStep[] = [
      { id: '1', role: 'Requestor', required: true, status: 'Pending' },
      { id: '2', role: 'Project Manager', required: true, status: 'Pending' },
    ];
    const isShortPrior = classification.duration === Duration.D1;
    steps.push({ id: '3', role: isShortPrior ? 'R&D responsible' : 'R&D Director / Business Line', required: true, status: 'Pending' });
    steps.push({ id: '4', role: isShortPrior ? 'ME series' : 'Head of ME', required: true, status: 'Pending' });
    steps.push({ id: '5', role: 'ASQE (Buy Part)', required: true, status: 'Pending' });
    steps.push({ id: '6', role: isShortPrior ? 'Quality Engineer (series)' : 'BU Quality Lead', required: true, status: 'Pending' });
    if (classification.duration === Duration.D3 || [Duration.D4, Duration.D5, Duration.D6].includes(classification.duration)) {
      steps.push({ id: '7', role: 'Plant Director', required: true, status: 'Pending' });
    }
    if (safety) {
      steps.push({ id: '8', role: 'Product Safety Officer', required: true, status: 'Pending' });
    }
    return steps;
  }

  function initialDeviation(): DeviationRecord {
    const classification = { language: 'English' as const, bu: BU.ET, trigger: Trigger.T0010, duration: Duration.D1 };
    return {
      id: `DAI_ET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      deviationType: deviationType,
      status: WorkflowStatus.Draft,
      classification,
      masterData: {
        requestDate: new Date().toISOString().split('T')[0],
        requestor: 'George Neacsu',
        department: 'Quality Engineering',
        materialNo: '',
        changeLevel: '',
        furtherMaterials: false,
        description: '',
        supplierIdent: '',
        supplierName: '',
        customerIdent: '',
        customerName: '',
        customerContact: '',
        customerProjectCode: '',
        plant: PLANTS[0],
        projectTitle: '',
        expirationDate: '',
        customerInformed: false,
        customerReleaseNecessary: false,
        productSafetyRelevant: false,
        attachments: [],
      },
      details: { specification: '', deviation: '' },
      risks: [],
      actions: [],
      stock: { useExisting: false },
      approvals: calculateRouting(classification, false),
      extensions: [],
    };
  }

  const updateClassification = (field: string, value: any) => {
    setDeviation(prev => {
      const updatedClass = { ...prev.classification, [field]: value };
      const updatedApprovals = calculateRouting(updatedClass, prev.masterData.productSafetyRelevant);
      return { ...prev, classification: updatedClass, approvals: updatedApprovals };
    });
  };

  const updateMasterData = (field: string, value: any) => {
    setDeviation(prev => {
      const updatedMD = { ...prev.masterData, [field]: value };
      let updatedApprovals = prev.approvals;
      if (field === 'productSafetyRelevant') {
        updatedApprovals = calculateRouting(prev.classification, value);
      }
      const updated = { ...prev, masterData: updatedMD, approvals: updatedApprovals };
      
      // Check for conflicts when material or deviation details change
      if (field === 'materialNo' || field === 'supplierName' || field === 'customerName' || field === 'plant') {
        checkConflictsDebounced(updated);
      }
      
      return updated;
    });
  };

  const updateDetails = (field: string, value: any) => {
    setDeviation(prev => {
      const updated = { ...prev, details: { ...prev.details, [field]: value } };
      checkConflictsDebounced(updated);
      return updated;
    });
  };

  // Debounced conflict checking
  const checkConflictsDebounced = React.useCallback((deviation: DeviationRecord) => {
    // Clear existing timeout
    if (conflictCheckTimeoutRef.current) {
      clearTimeout(conflictCheckTimeoutRef.current);
    }

    // Set new timeout for debounced check
    conflictCheckTimeoutRef.current = setTimeout(async () => {
      setCheckingConflicts(true);
      try {
        const result = await conflictDetectionService.checkSimilarityConflicts(deviation);
        setConflictAlerts(result.conflicts);
      } catch (error) {
        console.error('Conflict check error:', error);
      } finally {
        setCheckingConflicts(false);
      }
    }, 1000); // Wait 1 second after user stops typing
  }, [conflictDetectionService]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (conflictCheckTimeoutRef.current) {
        clearTimeout(conflictCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const aiService = new AIService();
      const result = await aiService.analyzeDeviation(deviation, redactionMode);
      setAIAnalysis(result);
    } catch (e) { 
      console.error('AI Analysis error:', e);
      alert('AI analysis failed. Please check your API key configuration.');
    }
    finally { setLoadingAI(false); }
  };

  const fetchERPData = () => {
    setLoadingAI(true);
    setTimeout(() => {
      if (deviation.deviationType === 'Supplier') {
      updateMasterData('supplierName', 'BOSCH Global Components');
      } else {
        updateMasterData('customerName', 'BMW Group');
        updateMasterData('customerContact', 'John Smith, john.smith@bmw.de, +49 89 12345678');
        updateMasterData('customerProjectCode', 'BMW-PROJ-2026-001');
      }
      updateMasterData('materialNo', '882-103-X');
      setLoadingAI(false);
    }, 800);
  };

  const handleTranslate = async (targetLanguage: SupportedLanguage) => {
    if (deviation.classification.language === targetLanguage) return;
    
    setTranslating(true);
    setTranslationResult(null);
    try {
      const translationService = new TranslationService();
      const result = await translationService.translateDeviation(deviation, targetLanguage);
      setDeviation(result.translatedRecord);
      setTranslationResult({
        confidence: result.confidence,
        termsPreserved: result.technicalTermsPreserved,
      });
      // Clear result after 5 seconds
      setTimeout(() => setTranslationResult(null), 5000);
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setTranslating(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const pdfService = new PDFExportService();
      const blob = await pdfService.generatePDFA(deviation, {
        includeQRCode: true,
        includeWatermark: true,
        watermarkText: deviation.status,
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SDA_${deviation.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF export error:', e);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Save to offline storage
      await offlineService.saveDeviation(deviation);
      
      // Update status if not already draft
      if (deviation.status !== WorkflowStatus.Draft) {
        setDeviation({ ...deviation, status: WorkflowStatus.Draft });
      }
      
      // Add to recent actions for timeline
      setRecentActions(prev => [
        ...prev,
        {
          action: 'Draft saved',
          timestamp: new Date(),
          type: 'save' as const,
        }
      ]);
      
      console.log('[Draft] Saved successfully');
    } catch (e) {
      console.error('Save draft error:', e);
      alert('Failed to save draft. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields before submission
      if (!deviation.classification.bu || !deviation.id) {
        alert('Please complete required fields before submitting.');
        return;
      }

      // Save to offline storage
      await offlineService.saveDeviation(deviation);
      
      // Update status to Submitted
      setDeviation({ 
        ...deviation, 
        status: WorkflowStatus.Submitted,
      });
      
      // Add to recent actions for timeline
      setRecentActions(prev => [
        ...prev,
        {
          action: 'Submitted for approval',
          timestamp: new Date(),
          type: 'submit' as const,
        }
      ]);
      
      console.log('[Submit] Deviation submitted successfully');
    } catch (e) {
      console.error('Submit error:', e);
      alert('Failed to submit deviation. Please try again.');
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this deviation? All unsaved changes will be lost.')) {
      // Reset to initial state
      setDeviation(initialDeviation());
      setAIAnalysis(null);
      setRecentActions([]);
      setConflictAlerts([]);
      setActiveFormTab('classification');
      console.log('[Discard] Deviation discarded');
    }
  };

  const renderDashboard = () => {
    const typeLabel = deviationType === 'Customer' ? 'Customer' : 'Supplier';
    
    // Dynamic metrics based on deviation type
    const metrics = deviationType === 'Customer' 
      ? {
          totalDeviations: { value: '98', trend: '+8% vs last month' },
          pendingApprovals: { value: '5', trend: '3 urgent' },
          avgCycleTime: { value: '5.4d', trend: '-0.6d improved' },
          complianceRiskScore: { value: '88', trend: 'Compliance: High' },
        }
      : {
          totalDeviations: { value: '124', trend: '+12% vs last month' },
          pendingApprovals: { value: '3', trend: '2 urgent' },
          avgCycleTime: { value: '4.2d', trend: '-0.8d improved' },
          complianceRiskScore: { value: '92', trend: 'Compliance: High' },
        };
    
    return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
       <h2 className="text-2xl font-extrabold ui-heading">{typeLabel} Deviation Approval Dashboard</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Deviations" value={metrics.totalDeviations.value} trend={metrics.totalDeviations.trend} icon="fa-chart-line" color="text-[#007aff] dark:text-[#60a5fa]" />
          <StatCard title="Pending Approvals" value={metrics.pendingApprovals.value} trend={metrics.pendingApprovals.trend} icon="fa-clock" color="text-amber-600 dark:text-amber-400" />
          <StatCard title="Avg. Cycle Time" value={metrics.avgCycleTime.value} trend={metrics.avgCycleTime.trend} icon="fa-bolt" color="text-emerald-600 dark:text-emerald-400" />
          <StatCard title="Compliance Risk Score" value={metrics.complianceRiskScore.value} trend={metrics.complianceRiskScore.trend} icon="fa-shield-halved" color="text-purple-600 dark:text-purple-400" />
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 glass glass-highlight spotlight rounded-[32px] p-8 space-y-10 hover-lift">
             <h2 className="text-2xl font-extrabold ui-heading" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Performance Analytics</h2>
             <AnalyticsCharts deviationType={deviationType} />
          </div>
          <div className="glass glass-highlight spotlight rounded-[32px] p-8 shadow-sm flex flex-col hover-lift">
             <ActivityFeed deviationType={deviationType} />
          </div>
       </div>
       
       {/* Advanced Analytics - Risk Heatmap */}
       <RiskHeatmap deviationType={deviationType} />
    </div>
  );
  };

  // Helper function to convert MOCK_APPROVAL to DeviationRecord for detail view
  const createDeviationFromApproval = (approval: typeof MOCK_APPROVALS[0]): DeviationRecord => {
    const baseDeviation = initialDeviation();
    return {
      ...baseDeviation,
      id: approval.id,
      deviationType: approval.deviationType,
      status: approval.status || WorkflowStatus.InReview,
      classification: {
        ...baseDeviation.classification,
        bu: approval.bu as BU,
      },
      masterData: {
        ...baseDeviation.masterData,
        materialNo: approval.material,
        requestor: approval.requestor,
        requestDate: approval.submittedDate,
        supplierName: approval.supplier,
        customerName: approval.customer,
      },
      risks: approval.rpn >= 125 ? [{
        id: 'risk-1',
        source: approval.deviationType === 'Supplier' ? 'Supplier' : 'Customer',
        description: 'High RPN identified',
        severity: 5,
        occurrence: 5,
        detection: 5,
        rpn: approval.rpn
      }] : [],
      approvals: calculateRouting(
        { bu: approval.bu as BU, trigger: Trigger.T0030, duration: Duration.D2, language: 'English' },
        false
      )
    };
  };

  const renderApprovals = () => {
    // Filter approvals based on deviation type and filters
    const filteredApprovals = MOCK_APPROVALS.filter(a => {
      if (a.deviationType !== deviationType) return false;
      if (approvalFilter.urgency !== 'all' && a.urgency !== approvalFilter.urgency) return false;
      if (approvalFilter.bu !== 'all' && a.bu !== approvalFilter.bu) return false;
      if (approvalFilter.search && 
          !a.id.toLowerCase().includes(approvalFilter.search.toLowerCase()) &&
          !a.title.toLowerCase().includes(approvalFilter.search.toLowerCase()) &&
          !a.material.toLowerCase().includes(approvalFilter.search.toLowerCase()) &&
          !(a.supplier || a.customer).toLowerCase().includes(approvalFilter.search.toLowerCase())) return false;
      return true;
    });

    // Calculate statistics
    const stats = {
      total: MOCK_APPROVALS.filter(a => a.deviationType === deviationType).length,
      critical: MOCK_APPROVALS.filter(a => a.deviationType === deviationType && a.urgency === 'Critical').length,
      highRisk: MOCK_APPROVALS.filter(a => a.deviationType === deviationType && (a.rpn || 0) >= 125).length,
      overdue: MOCK_APPROVALS.filter(a => a.deviationType === deviationType && (a.pendingDays || 0) > 7).length,
      avgDays: Math.round(MOCK_APPROVALS.filter(a => a.deviationType === deviationType).reduce((sum, a) => sum + (a.pendingDays || 0), 0) / MOCK_APPROVALS.filter(a => a.deviationType === deviationType).length * 10) / 10
    };

    // Detail view
    if (selectedApprovalId) {
      const selected = MOCK_APPROVALS.find(a => a.id === selectedApprovalId);
      if (!selected) return null;
      
      const approvalDeviation = createDeviationFromApproval(selected);
      
      return (
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Back Button */}
          <button 
            onClick={() => {
              setSelectedApprovalId(null);
              setDecisionComment('');
            }} 
            className="flex items-center gap-2 text-[#007aff] font-bold text-sm hover:translate-x-[-4px] transition-transform"
          >
             <i className="fa-solid fa-arrow-left"></i> Back to Queue
          </button>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              {/* Header Info */}
              <div className="glass rounded-[32px] border border-white/50 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-black ui-text-secondary uppercase">{selected.id}</span>
                      {selected.rpn >= 125 && (
                        <span className="text-[9px] font-black px-2 py-1 rounded bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 uppercase">
                          <i className="fa-solid fa-exclamation-triangle mr-1"></i>High Risk
                        </span>
                      )}
                      <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                        selected.urgency === 'Critical' ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30' :
                        selected.urgency === 'High' ? 'bg-orange-100 dark:bg-orange-900/25 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30' :
                        selected.urgency === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}>
                        {selected.urgency}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black ui-heading dark:text-slate-100 transition-colors mb-4">{selected.title}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-1">
                        <p className="ui-label">{selected.deviationType}</p>
                        <p className="text-sm font-bold ui-text-primary">{selected.supplier || selected.customer}</p>
                   </div>
                   <div className="space-y-1">
                        <p className="ui-label">Material</p>
                        <p className="text-sm font-bold ui-text-primary">{selected.material}</p>
                   </div>
                   <div className="space-y-1">
                        <p className="ui-label">RPN Score</p>
                        <p className={`text-sm font-bold ${selected.rpn >= 125 ? 'text-red-600 dark:text-red-400' : 'ui-text-primary'} transition-colors`}>
                          {selected.rpn}
                        </p>
                   </div>
                      <div className="space-y-1">
                        <p className="ui-label">Current Step</p>
                        <p className="text-sm font-bold ui-text-primary">{selected.step}</p>
                </div>
             </div>
                  </div>
                </div>
              </div>

              {/* Approval Timeline */}
              <ApprovalTimeline deviation={approvalDeviation} compact={false} recentActions={[]} />

              {/* Approval Steps */}
              <div className="glass rounded-[32px] border border-white/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <i className="fa-solid fa-route text-[#007aff] dark:text-[#60a5fa] text-lg"></i>
                  <div>
                    <h3 className="text-lg font-extrabold ui-heading">Approval Workflow</h3>
                    <p className="text-[10px] font-medium ui-text-secondary">Based on Business Unit, Trigger Code, and Duration Category</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvalDeviation.approvals.map(step => (
                    <div key={step.id} className="glass glass-highlight spotlight p-5 rounded-[24px] hover-lift transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-[10px] font-black ui-label mb-2">{step.role}</p>
                          <p className="text-sm font-bold ui-text-primary">{step.status === 'Pending' ? 'TBD' : step.status}</p>
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full ${
                          step.status === 'Pending' 
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                            : step.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      {step.comments && (
                        <p className="text-xs ui-text-secondary mt-2 italic">{step.comments}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Adaptive Cards Section */}
              {approvalDeviation.approvals.some(s => s.status === 'Pending') && (
                <div className="glass rounded-[32px] border border-white/50 p-8">
                  <h3 className="text-lg font-extrabold ui-heading mb-4">Send Approval Request via Chat</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {approvalDeviation.approvals
                      .filter(step => step.status === 'Pending')
                      .map(step => (
                        <div key={step.id}>
                          <AdaptiveCardPreview
                            deviation={approvalDeviation}
                            approver={step.role}
                            stepId={step.id}
                            deviationType={selected.deviationType}
                            onSend={async (platform) => {
                              const service = new AdaptiveCardsService();
                              if (platform === 'teams') {
                                await service.sendToTeams(approvalDeviation, `${step.role}@webasto.com`, step.id);
                              } else {
                                await service.sendToSlack(approvalDeviation, step.role.toLowerCase().replace(/\s+/g, '.'), step.id, '#approvals');
                              }
                            }}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Decision Center Sidebar */}
            <div className="w-full xl:w-auto">
              <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl sticky top-28">
                <h3 className="text-lg font-extrabold ui-heading dark:text-slate-100 mb-6 transition-colors">Decision Center</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <p className="text-[10px] font-black ui-label mb-1">PENDING YOUR REVIEW</p>
                    <p className="text-sm font-bold ui-text-primary">{selected.step}</p>
                  </div>
                <textarea 
                    className="apple-input" 
                    rows={6} 
                    placeholder="Enter your justification or comments..."
                  value={decisionComment}
                  onChange={e => setDecisionComment(e.target.value)}
                />
                <button 
                  disabled={isDecisionSubmitting}
                    onClick={() => {
                      setIsDecisionSubmitting(true);
                      setTimeout(() => {
                        setSelectedApprovalId(null);
                        setDecisionComment('');
                        setIsDecisionSubmitting(false);
                        alert('Approval decision submitted successfully!');
                      }, 1000);
                    }}
                    className="apple-btn-success w-full"
                  >
                    {isDecisionSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-check"></i>
                        Approve
                      </span>
                    )}
                </button>
                  <button 
                    disabled={isDecisionSubmitting}
                    onClick={() => {
                      setIsDecisionSubmitting(true);
                      setTimeout(() => {
                        setSelectedApprovalId(null);
                        setDecisionComment('');
                        setIsDecisionSubmitting(false);
                        alert('Rejection submitted successfully!');
                      }, 1000);
                    }}
                    className="apple-btn-danger w-full"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <i className="fa-solid fa-times"></i>
                      Reject
                    </span>
                  </button>
                  <div className="pt-4 border-t border-white/20 dark:border-slate-700">
                    <p className="text-[10px] font-medium ui-text-secondary">
                      <strong className="font-bold">Note:</strong> Your decision will be recorded in the audit trail and all stakeholders will be notified.
                    </p>
                  </div>
                </div>
              </div>
             </div>
          </div>
        </div>
      );
    }

    // List view
    return (
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                 <div>
            <h2 className="text-3xl font-extrabold ui-heading dark:text-slate-100 transition-colors">
              {deviationType} Approvals Queue
            </h2>
            <p className="text-sm ui-text-secondary mt-2">
              Manage and review pending {deviationType.toLowerCase()} deviation approvals
            </p>
                 </div>
              </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-clipboard-list text-blue-500 dark:text-blue-400"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold ui-heading mb-1">{stats.total}</div>
            <div className="text-xs font-bold ui-text-secondary">Total Pending</div>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-exclamation-triangle text-red-500 dark:text-red-400"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mb-1">{stats.critical}</div>
            <div className="text-xs font-bold ui-text-secondary">Critical Urgency</div>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-chart-line text-amber-500 dark:text-amber-400"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mb-1">{stats.highRisk}</div>
            <div className="text-xs font-bold ui-text-secondary">High Risk (RPN ≥125)</div>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-clock text-purple-500 dark:text-purple-400"></i>
              </div>
            </div>
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">{stats.overdue}</div>
              <div className="text-xs font-bold ui-text-secondary">Overdue (&gt;7 days)</div>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-calendar text-emerald-500 dark:text-emerald-400"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">{stats.avgDays}</div>
            <div className="text-xs font-bold ui-text-secondary">Avg. Days Pending</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-[32px] border border-white/50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black ui-label mb-2 block">Search</label>
              <input
                type="text"
                className="apple-input"
                placeholder="Search by ID, title, material..."
                value={approvalFilter.search}
                onChange={e => setApprovalFilter({ ...approvalFilter, search: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black ui-label mb-2 block">Urgency</label>
              <select
                className="apple-input"
                value={approvalFilter.urgency}
                onChange={e => setApprovalFilter({ ...approvalFilter, urgency: e.target.value as any })}
              >
                <option value="all">All Urgency Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black ui-label mb-2 block">Business Unit</label>
              <select
                className="apple-input"
                value={approvalFilter.bu}
                onChange={e => setApprovalFilter({ ...approvalFilter, bu: e.target.value as any })}
              >
                <option value="all">All BUs</option>
                {BUs.map(bu => (
                  <option key={bu} value={bu}>{bu}</option>
                ))}
              </select>
        </div>
          </div>
        </div>

        {/* Approvals List */}
        <div className="space-y-4">
          {filteredApprovals.length === 0 ? (
            <div className="glass rounded-[32px] border border-white/50 p-12 text-center">
              <i className="fa-solid fa-inbox text-4xl ui-text-tertiary mb-4"></i>
              <p className="text-lg font-bold ui-text-primary mb-2">No approvals found</p>
              <p className="text-sm ui-text-secondary">Try adjusting your filters</p>
            </div>
          ) : (
            filteredApprovals.map(approval => {
              const approvalDeviation = createDeviationFromApproval(approval);
              return (
                <div 
                  key={approval.id} 
                  onClick={() => setSelectedApprovalId(approval.id)} 
                  className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift hover-glow transition-all cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="text-[10px] font-black ui-text-secondary uppercase">{approval.id}</span>
                        {approval.rpn >= 125 && (
                          <span className="text-[9px] font-black px-2 py-1 rounded bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 uppercase">
                            <i className="fa-solid fa-exclamation-triangle mr-1"></i>High Risk
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                          approval.urgency === 'Critical' ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30' :
                          approval.urgency === 'High' ? 'bg-orange-100 dark:bg-orange-900/25 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30' :
                          approval.urgency === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}>
                          {approval.urgency}
                        </span>
                      </div>
                      <h3 className="text-lg font-black ui-text-primary mb-3">{approval.title}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[10px] font-black ui-label mb-1">{approval.deviationType}</p>
                          <p className="text-sm font-bold ui-text-secondary">{approval.supplier || approval.customer}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black ui-label mb-1">Material</p>
                          <p className="text-sm font-bold ui-text-secondary">{approval.material}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black ui-label mb-1">RPN</p>
                          <p className={`text-sm font-bold ${approval.rpn >= 125 ? 'text-red-600 dark:text-red-400' : 'ui-text-secondary'}`}>
                            {approval.rpn}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black ui-label mb-1">Pending</p>
                          <p className="text-sm font-bold ui-text-secondary">{approval.pendingDays} day{approval.pendingDays !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Preview */}
                    <div className="lg:w-[480px] flex-shrink-0">
                      <ApprovalTimeline deviation={approvalDeviation} compact={true} recentActions={[]} />
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <i className="fa-solid fa-chevron-right ui-text-tertiary group-hover:text-[#007aff] group-hover:translate-x-1 transition-all text-xl"></i>
                    </div>
        </div>
                </div>
              );
            })
          )}
        </div>

        {/* Batch Approval Notice */}
        {filteredApprovals.some(a => a.rpn < 40) && (
          <div className="glass glass-highlight rounded-[32px] border border-white/50 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-bolt text-blue-500 dark:text-blue-400 text-xl"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold ui-heading mb-1">Batch Approval Mode Available</p>
                <p className="text-xs ui-text-secondary">
                  {filteredApprovals.filter(a => a.rpn < 40).length} approval{filteredApprovals.filter(a => a.rpn < 40).length !== 1 ? 's' : ''} with RPN {"<"} 40 can be batch approved.
                </p>
              </div>
              <button className="apple-btn-primary px-6 py-2.5 text-xs flex items-center gap-2">
                <i className="fa-solid fa-check-double"></i>
                Batch Approve
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderArchive = () => {
    const typeLabel = deviationType === 'Customer' ? 'Customer' : 'Supplier';
    
    // Filter history based on current settings
    const filteredHistory = MOCK_HISTORY.filter(h => {
      if (h.deviationType !== deviationType) return false;
      if (archiveFilter.status !== 'all' && h.status !== archiveFilter.status) return false;
      if (archiveFilter.bu !== 'all' && h.BU !== archiveFilter.bu) return false;
      if (archiveFilter.search && !h.id.toLowerCase().includes(archiveFilter.search.toLowerCase()) && 
          !h.material.toLowerCase().includes(archiveFilter.search.toLowerCase()) &&
          !(h.supplier || h.customer).toLowerCase().includes(archiveFilter.search.toLowerCase())) return false;
      
      if (archiveFilter.dateRange !== 'all') {
        const recordDate = new Date(h.date);
        const now = new Date();
        const monthsAgo = archiveFilter.dateRange === '3m' ? 3 : archiveFilter.dateRange === '6m' ? 6 : 12;
        const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate());
        if (recordDate < cutoffDate) return false;
      }
      
      return true;
    });
    
    // Calculate statistics
    const stats = {
      total: MOCK_HISTORY.filter(h => h.deviationType === deviationType).length,
      approved: MOCK_HISTORY.filter(h => h.deviationType === deviationType && h.status === WorkflowStatus.Approved).length,
      rejected: MOCK_HISTORY.filter(h => h.deviationType === deviationType && h.status === WorkflowStatus.Rejected).length,
      avgCycleTime: Math.round(MOCK_HISTORY.filter(h => h.deviationType === deviationType).reduce((sum, h) => sum + (h.cycleTime || 0), 0) / MOCK_HISTORY.filter(h => h.deviationType === deviationType).length * 10) / 10,
      highRisk: MOCK_HISTORY.filter(h => h.deviationType === deviationType && (h.rpn || 0) >= 125).length,
    };

    return (
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-3xl font-extrabold ui-heading dark:text-slate-100 transition-colors">{typeLabel} Historical Archive</h2>
            <p className="text-sm ui-text-secondary mt-2">Complete audit trail and historical records for {typeLabel.toLowerCase()} deviations</p>
          </div>
          <button className="apple-btn-primary px-6 py-2.5 text-xs flex items-center gap-2">
            <i className="fa-solid fa-download"></i>
            <span>Export Archive</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <i className="fa-solid fa-file-lines text-lg"></i>
              </div>
            </div>
            <p className="text-3xl font-black text-blue-500 dark:text-blue-400 transition-colors mb-1">{stats.total}</p>
            <p className="text-[10px] font-black ui-label uppercase tracking-widest">Total Records</p>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <i className="fa-solid fa-check-circle text-lg"></i>
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400 transition-colors mb-1">{stats.approved}</p>
            <p className="text-[10px] font-black ui-label uppercase tracking-widest">Approved</p>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                <i className="fa-solid fa-xmark-circle text-lg"></i>
              </div>
            </div>
            <p className="text-3xl font-black text-red-500 dark:text-red-400 transition-colors mb-1">{stats.rejected}</p>
            <p className="text-[10px] font-black ui-label uppercase tracking-widest">Rejected</p>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                <i className="fa-solid fa-clock text-lg"></i>
              </div>
            </div>
            <p className="text-3xl font-black text-purple-500 dark:text-purple-400 transition-colors mb-1">{stats.avgCycleTime}d</p>
            <p className="text-[10px] font-black ui-label uppercase tracking-widest">Avg. Cycle</p>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i>
              </div>
            </div>
            <p className="text-3xl font-black text-amber-500 dark:text-amber-400 transition-colors mb-1">{stats.highRisk}</p>
            <p className="text-[10px] font-black ui-label uppercase tracking-widest">High Risk</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass glass-highlight spotlight rounded-[32px] p-6 hover-lift">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black ui-label uppercase tracking-widest mb-2 block">Search</label>
              <input
                type="text"
                placeholder="Search by ID, Material, Supplier/Customer..."
                value={archiveFilter.search}
                onChange={(e) => setArchiveFilter({ ...archiveFilter, search: e.target.value })}
                className="apple-input w-full"
              />
            </div>
            <div>
              <label className="text-[10px] font-black ui-label uppercase tracking-widest mb-2 block">Status</label>
              <select
                value={archiveFilter.status}
                onChange={(e) => setArchiveFilter({ ...archiveFilter, status: e.target.value as any })}
                className="apple-input apple-select w-full"
              >
                <option value="all">All Statuses</option>
                <option value={WorkflowStatus.Approved}>Approved</option>
                <option value={WorkflowStatus.Rejected}>Rejected</option>
                <option value={WorkflowStatus.Closed}>Closed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black ui-label uppercase tracking-widest mb-2 block">Date Range</label>
              <select
                value={archiveFilter.dateRange}
                onChange={(e) => setArchiveFilter({ ...archiveFilter, dateRange: e.target.value as any })}
                className="apple-input apple-select w-full"
              >
                <option value="all">All Time</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="12m">Last 12 Months</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-[10px] font-black ui-label uppercase tracking-widest mb-2 block">Business Unit</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setArchiveFilter({ ...archiveFilter, bu: 'all' })}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  archiveFilter.bu === 'all'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/60 dark:bg-slate-800/40 ui-text-primary hover:bg-white/80 dark:hover:bg-slate-800/60'
                }`}
              >
                All BU
              </button>
              {BUs.map(bu => (
                <button
                  key={bu}
                  onClick={() => setArchiveFilter({ ...archiveFilter, bu })}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                    archiveFilter.bu === bu
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/60 dark:bg-slate-800/40 ui-text-primary hover:bg-white/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {bu}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Archive Table */}
        <div className="glass glass-highlight spotlight rounded-[32px] overflow-hidden hover-lift">
          <div className="p-6 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold ui-heading">Archived Deviations</h3>
              <p className="text-xs ui-text-secondary mt-1">{filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''} found</p>
            </div>
            <button className="apple-btn-secondary px-4 py-2 text-xs flex items-center gap-2">
              <i className="fa-solid fa-filter"></i>
              <span>Advanced Filters</span>
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 transition-colors">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">Deviation ID</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">Material No.</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">{deviationType === 'Customer' ? 'Customer' : 'Supplier'}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">BU</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">RPN</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">Approver</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label">Cycle Time</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase ui-label text-right">Actions</th>
                </tr>
             </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-8 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <i className="fa-solid fa-inbox text-4xl text-slate-300 dark:text-slate-600"></i>
                        <p className="text-sm font-bold ui-text-secondary">No records found</p>
                        <p className="text-xs ui-text-tertiary">Try adjusting your filters</p>
                      </div>
                      </td>
                  </tr>
                ) : (
                  filteredHistory.map(h => (
                    <tr key={h.id} className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm ui-text-primary">{h.id}</span>
                      </td>
                      <td className="px-6 py-4 text-xs ui-text-secondary">{h.material}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold ui-text-primary">{(h.supplier || h.customer) || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {h.BU}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-xs ${
                          (h.rpn || 0) >= 125 ? 'text-red-500 dark:text-red-400' : 
                          (h.rpn || 0) >= 60 ? 'text-amber-500 dark:text-amber-400' : 
                          'text-emerald-500 dark:text-emerald-400'
                        }`}>
                          {h.rpn || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const pill = getStatusPill(h.status);
                          return (
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${pill.className}`}>
                              {pill.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-xs ui-text-secondary">{h.approver || 'N/A'}</td>
                      <td className="px-6 py-4 text-xs ui-text-secondary">{h.date}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold ui-text-primary">{h.cycleTime || '-'}d</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700/60 ui-text-secondary hover:ui-text-primary transition-colors" title="View Details">
                            <i className="fa-solid fa-eye text-xs"></i>
                          </button>
                          <button className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700/60 ui-text-secondary hover:ui-text-primary transition-colors" title="Export PDF">
                            <i className="fa-solid fa-file-pdf text-xs"></i>
                          </button>
                        </div>
                      </td>
                   </tr>
                  ))
                )}
             </tbody>
          </table>
          </div>
          {filteredHistory.length > 0 && (
            <div className="p-6 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
              <p className="text-xs ui-text-secondary">Showing {filteredHistory.length} of {stats.total} records</p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-white/60 dark:bg-slate-800/40 ui-text-primary hover:bg-white/80 dark:hover:bg-slate-800/60 transition-all">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <span className="px-4 py-2 text-xs font-bold ui-text-primary">1</span>
                <button className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-white/60 dark:bg-slate-800/40 ui-text-primary hover:bg-white/80 dark:hover:bg-slate-800/60 transition-all">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
       </div>
    </div>
  );
  };

  const updateDeviationType = (type: 'Supplier' | 'Customer') => {
    setDeviationType(type);
    setDeviation(prev => ({
      ...prev,
      deviationType: type,
      // Clear type-specific fields when switching
      masterData: {
        ...prev.masterData,
        ...(type === 'Supplier' 
          ? { customerIdent: '', customerName: '', customerContact: '', customerProjectCode: '' }
          : { supplierIdent: '', supplierName: '' }
        )
      }
    }));
  };

  const renderCompliance = () => {
    const typeLabel = deviationType === 'Customer' ? 'Customer' : 'Supplier';
    
    // Dynamic compliance metrics based on deviation type
    const complianceMetrics = deviationType === 'Customer' 
      ? {
          documentationHealth: 89.7,
          caClosureRate: 85.3,
          iatfComplianceScore: 91.2,
          auditReadiness: 87.8,
          openActions: 12,
          overdueActions: 3,
          criticalRisks: 8,
          lastAuditDate: '2024-11-15',
          nextAuditDate: '2025-05-15',
          deviationCount: 98,
          complianceTrend: '+2.1%',
        }
      : {
          documentationHealth: 92.4,
          caClosureRate: 88.1,
          iatfComplianceScore: 94.6,
          auditReadiness: 91.3,
          openActions: 18,
          overdueActions: 2,
          criticalRisks: 12,
          lastAuditDate: '2024-10-20',
          nextAuditDate: '2025-04-20',
          deviationCount: 124,
          complianceTrend: '+3.2%',
        };

    return (
    <div className="max-w-[1600px] mx-auto space-y-8">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-extrabold ui-heading dark:text-slate-100 transition-colors">{typeLabel} Compliance & Audit Readiness</h2>
           <p className="text-sm ui-text-secondary mt-2">ISO 9001 & IATF 16949 Quality Management System Compliance Dashboard</p>
          </div>
          </div>

       {/* Key Compliance Metrics */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
             <div className="flex items-center justify-between mb-3">
               <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                 <i className="fa-solid fa-file-circle-check text-lg"></i>
               </div>
               <span className={`text-xs font-black px-2 py-1 rounded-full ${
                 complianceMetrics.documentationHealth >= 90 
                   ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400'
                   : complianceMetrics.documentationHealth >= 80
                   ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400'
                   : 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400'
               }`}>
                 {complianceMetrics.documentationHealth >= 90 ? 'EXCELLENT' : complianceMetrics.documentationHealth >= 80 ? 'GOOD' : 'ATTENTION'}
               </span>
             </div>
             <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400 transition-colors mb-1">{complianceMetrics.documentationHealth}%</p>
             <p className="text-[10px] font-black ui-label uppercase tracking-widest">Documentation Health</p>
             <p className="text-[9px] ui-text-tertiary mt-1">ISO 9001 & IATF 16949 record completeness & traceability</p>
          </div>

          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
             <div className="flex items-center justify-between mb-3">
               <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                 <i className="fa-solid fa-clipboard-check text-lg"></i>
               </div>
               <span className={`text-xs font-black px-2 py-1 rounded-full ${
                 complianceMetrics.caClosureRate >= 85 
                   ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400'
                   : 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400'
               }`}>
                 {complianceMetrics.caClosureRate >= 85 ? 'ON TRACK' : 'REVIEW'}
               </span>
             </div>
             <p className="text-3xl font-black text-blue-500 dark:text-blue-400 transition-colors mb-1">{complianceMetrics.caClosureRate}%</p>
             <p className="text-[10px] font-black ui-label uppercase tracking-widest">CA Closure Rate</p>
             <p className="text-[9px] ui-text-tertiary mt-1">Corrective Actions completed on time</p>
          </div>

          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
             <div className="flex items-center justify-between mb-3">
               <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                 <i className="fa-solid fa-shield-halved text-lg"></i>
               </div>
               <span className="text-xs font-black px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400">
                 COMPLIANT
               </span>
             </div>
             <p className="text-3xl font-black text-purple-500 dark:text-purple-400 transition-colors mb-1">{complianceMetrics.iatfComplianceScore}%</p>
             <p className="text-[10px] font-black ui-label uppercase tracking-widest">ISO/IATF Compliance Score</p>
             <p className="text-[9px] ui-text-tertiary mt-1">Overall {typeLabel.toLowerCase()} deviation compliance (ISO 9001 & IATF 16949)</p>
          </div>

          <div className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift">
             <div className="flex items-center justify-between mb-3">
               <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                 <i className="fa-solid fa-clipboard-list text-lg"></i>
               </div>
               <span className="text-xs font-black px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400">
                 READY
               </span>
             </div>
             <p className="text-3xl font-black text-amber-500 dark:text-amber-400 transition-colors mb-1">{complianceMetrics.auditReadiness}%</p>
             <p className="text-[10px] font-black ui-label uppercase tracking-widest">Audit Readiness</p>
             <p className="text-[9px] ui-text-tertiary mt-1">Prepared for next ISO/IATF audit</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Compliance Status & Actions */}
          <div className="lg:col-span-2 space-y-6">
             {/* Action Items */}
             <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-extrabold ui-heading">Corrective Actions & Open Items</h3>
                 <span className="text-xs font-black text-red-500 dark:text-red-400">{complianceMetrics.overdueActions} Overdue</span>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-50/50 to-amber-50/50 dark:from-red-900/10 dark:to-amber-900/10 border border-red-100/50 dark:border-red-800/30">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
                           <i className="fa-solid fa-exclamation-triangle text-sm"></i>
                        </div>
                        <div>
                           <p className="text-sm font-black ui-heading">Critical RPN Deviation Identified</p>
                           <p className="text-xs ui-text-secondary">Supplier: {deviationType === 'Supplier' ? 'Bosch Components' : 'BMW Group'} • Action required within 48h</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400">OVERDUE</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-100/50 dark:border-amber-800/30">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
                           <i className="fa-solid fa-clock text-sm"></i>
                        </div>
                        <div>
                           <p className="text-sm font-black ui-heading">Documentation Gap Identified</p>
                           <p className="text-xs ui-text-secondary">Missing FMEA assessment • Due: 3 days</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400">IN PROGRESS</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-emerald-50/50 dark:from-blue-900/10 dark:to-emerald-900/10 border border-blue-100/50 dark:border-blue-800/30">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                           <i className="fa-solid fa-file-signature text-sm"></i>
                        </div>
                        <div>
                           <p className="text-sm font-black ui-heading">Approval Signature Pending</p>
                           <p className="text-xs ui-text-secondary">{complianceMetrics.openActions - 2} deviations awaiting final approval</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400">PENDING</span>
                  </div>
               </div>
            </div>

             {/* Compliance Metrics Chart */}
             <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
               <h3 className="text-lg font-extrabold ui-heading mb-6">Compliance Trend (Last 12 Months)</h3>
               <div className="space-y-6">
                  <div>
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black ui-label uppercase">Overall Compliance</span>
                        <span className="text-xs font-black text-emerald-500">{complianceMetrics.complianceTrend}</span>
                     </div>
                     <div className="h-3 w-full bg-slate-100/70 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${complianceMetrics.iatfComplianceScore}%` }}
                        ></div>
                     </div>
                  </div>
                  <div>
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black ui-label uppercase">Documentation Completeness</span>
                        <span className="text-xs font-black text-blue-500">+1.8%</span>
                     </div>
                     <div className="h-3 w-full bg-slate-100/70 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${complianceMetrics.documentationHealth}%` }}
                        ></div>
                     </div>
                  </div>
                  <div>
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black ui-label uppercase">CA Closure Rate</span>
                        <span className="text-xs font-black text-amber-500">+2.3%</span>
                     </div>
                     <div className="h-3 w-full bg-slate-100/70 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${complianceMetrics.caClosureRate}%` }}
                        ></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Audit Schedule & Stats */}
          <div className="space-y-6">
             {/* Audit Schedule */}
             <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
               <h3 className="text-lg font-extrabold ui-heading mb-6">Audit Schedule</h3>
               <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200/50 dark:border-slate-700/50">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black ui-label uppercase">Last Audit</span>
                        <span className="text-[10px] font-black text-emerald-500">PASSED</span>
                     </div>
                     <p className="text-sm font-bold ui-text-primary">{complianceMetrics.lastAuditDate}</p>
                     <p className="text-[9px] ui-text-tertiary mt-1">ISO 9001 & IATF 16949 Certification Audit</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-emerald-50/50 dark:from-blue-900/10 dark:to-emerald-900/10 border border-blue-100/50 dark:border-blue-800/30">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black ui-label uppercase">Next Audit</span>
                        <span className="text-[10px] font-black text-amber-500">IN 4 MONTHS</span>
                     </div>
                     <p className="text-sm font-bold ui-text-primary">{complianceMetrics.nextAuditDate}</p>
                     <p className="text-[9px] ui-text-tertiary mt-1">Annual ISO 9001 & IATF 16949 Recertification</p>
                  </div>
               </div>
            </div>

             {/* Quick Stats */}
             <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
               <h3 className="text-lg font-extrabold ui-heading mb-6">Quick Statistics</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/30 dark:bg-white/5 border border-white/20">
                     <div className="flex items-center gap-2">
                        <i className="fa-solid fa-file-lines text-blue-500"></i>
                        <span className="text-xs font-bold ui-label">Total Deviations</span>
                     </div>
                     <span className="text-sm font-black ui-text-primary">{complianceMetrics.deviationCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/30 dark:bg-white/5 border border-white/20">
                     <div className="flex items-center gap-2">
                        <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                        <span className="text-xs font-bold ui-label">Critical Risks</span>
                     </div>
                     <span className="text-sm font-black text-red-500">{complianceMetrics.criticalRisks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/30 dark:bg-white/5 border border-white/20">
                     <div className="flex items-center gap-2">
                        <i className="fa-solid fa-clipboard-list text-amber-500"></i>
                        <span className="text-xs font-bold ui-label">Open Actions</span>
                     </div>
                     <span className="text-sm font-black text-amber-500">{complianceMetrics.openActions}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/30 dark:bg-white/5 border border-white/20">
                     <div className="flex items-center gap-2">
                        <i className="fa-solid fa-xmark-circle text-red-500"></i>
                        <span className="text-xs font-bold ui-label">Overdue Actions</span>
                     </div>
                     <span className="text-sm font-black text-red-500">{complianceMetrics.overdueActions}</span>
                  </div>
               </div>
            </div>

             {/* ISO/IATF Requirements Checklist */}
             <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
               <h3 className="text-lg font-extrabold ui-heading mb-6">ISO 9001 & IATF 16949 Requirements</h3>
               <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-xs font-bold ui-text-primary">FMEA Documentation (IATF)</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-xs font-bold ui-text-primary">Approval Workflow Matrix</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-xs font-bold ui-text-primary">Audit Trail Completeness (ISO/IATF)</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-xs font-bold ui-text-primary">Document Control (ISO 9001)</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-xs font-bold ui-text-primary">Digital Signature Ready</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                     <i className="fa-solid fa-clock text-amber-500"></i>
                     <span className="text-xs font-bold ui-text-primary">8D/CAPA Documentation (IATF)</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-xs font-bold ui-text-primary">Risk-Based Thinking (ISO 9001)</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-xs font-bold ui-text-primary">Corrective Action Process (ISO/IATF)</span>
                  </div>
               </div>
            </div>
          </div>
       </div>
    </div>
  );
  };

  const renderAdmin = () => {
    const typeLabel = deviationType === 'Customer' ? 'Customer' : 'Supplier';
    return (
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
             <h2 className="text-3xl font-extrabold ui-heading dark:text-slate-100 transition-colors">Administration Console</h2>
             <p className="ui-text-secondary font-medium">Control governance, users, and AI parameters for Global SDA.</p>
          </div>
          <div className="segmented-control flex gap-1 p-1 shadow-sm border border-slate-200/50">
             {[
               { id: 'users', label: 'User Directory', icon: 'fa-users' },
               { id: 'matrix', label: 'Approval Routing', icon: 'fa-route' },
               { id: 'ai', label: 'AI Governance', icon: 'fa-brain' },
             ].map(sec => (
               <button 
                 key={sec.id}
                 onClick={() => setAdminSection(sec.id as any)} 
                 className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                   adminSection === sec.id 
                     ? 'bg-white dark:bg-slate-700 text-[#007aff] shadow-md' 
                     : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                 }`}
               >
                 <i className={`fa-solid ${sec.icon}`}></i>
                 <span className="hidden sm:inline">{sec.label}</span>
               </button>
             ))}
          </div>
        </div>

        {adminSection === 'users' && (
          <div className="glass rounded-[32px] border border-white/50 overflow-hidden shadow-xl">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/40">
               <div>
                  <h3 className="text-lg font-black ui-heading">IAM & Directory</h3>
                  <p className="text-[10px] font-black ui-label mt-1">Total active users: 1,402</p>
               </div>
               <button className="apple-btn-primary px-6 py-2.5 text-xs flex items-center gap-2">
                  <i className="fa-solid fa-plus"></i> Invite User
               </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] ui-label border-b border-slate-100 dark:border-slate-700">
                      <th className="px-8 py-5">Full Name / Profile</th>
                      <th className="px-8 py-5">Global Role</th>
                      <th className="px-8 py-5">BU Scope</th>
                      <th className="px-8 py-5">Last Activity</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { name: 'George Neacsu', role: 'Global Admin', bu: 'ALL', status: 'Active', color: 'bg-emerald-50 text-emerald-600', time: '2 mins ago' },
                      { name: 'Marcus Weber', role: 'Approver', bu: 'ET, RB', status: 'Active', color: 'bg-blue-50 text-blue-600', time: '4 hours ago' },
                      { name: 'Lena Schmidt', role: 'Requestor', bu: 'RX', status: 'Active', color: 'bg-slate-50 text-slate-500', time: 'Yesterday' },
                      { name: 'Hans Müller', role: 'Plant Director', bu: 'ET (Arad)', status: 'Away', color: 'bg-amber-50 text-amber-600', time: '3 days ago' },
                      { name: 'Yuki Tanaka', role: 'Quality Lead', bu: 'RT (Yokohama)', status: 'Active', color: 'bg-blue-50 text-blue-600', time: '1 hour ago' },
                    ].map((user, i) => (
                      <tr key={i} className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gradient-to-tr from-slate-200 to-white dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 transition-colors">
                                 <i className="fa-solid fa-user-tie"></i>
                              </div>
                              <div>
                                 <p className="text-sm font-bold ui-text-primary">{user.name}</p>
                                 <p className="text-[10px] ui-text-secondary">george.neacsu@webasto.com</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.color} dark:opacity-90`}>
                              {user.role}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold ui-text-primary">{user.bu}</td>
                        <td className="px-8 py-6 text-xs ui-text-secondary">{user.time}</td>
                        <td className="px-8 py-6 text-right">
                           <button className="ui-icon-btn">
                              <i className="fa-solid fa-ellipsis"></i>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
               <button className="text-[10px] font-black uppercase tracking-[0.2em] ui-text-tertiary hover:ui-text-secondary">Load More Stakeholders</button>
            </div>
          </div>
        )}

        {adminSection === 'matrix' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-2 space-y-8">
                <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                         <h3 className="text-xl font-black ui-heading">Global Routing Policies</h3>
                         <p className="text-xs ui-text-secondary font-medium">Automatic determination of required signatures.</p>
                      </div>
                      <button className="apple-btn-secondary px-4 py-2 text-[10px]">Policy Audit Log</button>
                   </div>

                   <div className="space-y-6">
                      {[
                        { title: 'Project Management Review', rule: 'Required for all initial SDA submissions', scope: 'Global', status: 'Locked' },
                        { title: 'R&D Signature - Level 1', rule: 'Duration ≤ 3m AND Status = Prior to Handover', scope: 'Standard', status: 'Active' },
                        { title: 'R&D Signature - Level 2', rule: 'Duration > 3m OR Status = After Handover', scope: 'Directorate', status: 'Active' },
                        { title: 'Plant Management sign-off', rule: 'Duration > 9m OR Site Risk Score > 4.5', scope: 'Site Specific', status: 'Mandatory' },
                        { title: 'Safety Integrity Check', rule: 'Product Safety Relevant = TRUE', scope: 'Safety Group', status: 'Bypass Disabled' },
                      ].map((rule, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-white/60 border border-white rounded-[28px] hover:bg-white transition-all shadow-sm">
                           <div className="flex items-center gap-5">
                              <div className="h-12 w-12 bg-blue-50 text-[#007aff] rounded-2xl flex items-center justify-center text-lg">
                                 <i className="fa-solid fa-code-merge"></i>
                              </div>
                              <div>
                                 <h4 className="text-sm font-black ui-heading">{rule.title}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#007aff]">{rule.scope}</span>
                                    <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                    <span className="text-[10px] font-medium text-slate-500">{rule.rule}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${rule.status === 'Locked' ? 'bg-slate-800 text-white/40' : 'bg-emerald-50 text-emerald-600'}`}>
                                 {rule.status}
                              </span>
                              <button className="text-slate-300 hover:text-slate-600"><i className="fa-solid fa-sliders"></i></button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl bg-gradient-to-b from-blue-50/50 to-transparent">
                   <h3 className="text-sm font-black ui-heading dark:text-slate-200 uppercase tracking-widest mb-6 transition-colors">Matrix Simulator</h3>
                   <div className="space-y-6">
                      <p className="text-xs ui-text-tertiary leading-relaxed font-medium italic">Test your routing logic by simulating a deviation scenario.</p>
                      
                      <div className="space-y-4">
                        <FormField label="Test Duration Category">
                           <select className="apple-input apple-select text-xs">
                              {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                        </FormField>
                        <FormField label="Safety Relevance">
                           <select className="apple-input apple-select text-xs">
                              <option>Low Risk / Not Relevant</option>
                              <option>Product Safety Critical</option>
                           </select>
                        </FormField>
                        <button className="w-full apple-btn-primary py-3 text-xs shadow-blue-500/20">Execute Calculation</button>
                      </div>

                      <div className="pt-6 border-t border-slate-200 space-y-4">
                         <h5 className="text-[10px] font-black ui-label">Expected Approvers</h5>
                         <div className="space-y-2">
                            {[1, 2, 3].map(j => <div key={j} className="h-8 bg-white/40 border border-white rounded-xl animate-pulse"></div>)}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {adminSection === 'ai' && (
          <div className="max-w-4xl mx-auto space-y-10">
             <div className="glass rounded-[32px] border border-white/50 p-10 shadow-2xl space-y-12">
                <div className="flex items-center gap-5">
                   <div className="h-14 w-14 bg-emerald-500 text-white rounded-[24px] flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/20">
                      <i className="fa-solid fa-brain"></i>
                   </div>
                   <div>
                      <h3 className="text-2xl font-black ui-heading dark:text-slate-100 transition-colors">AI Governance & Tuning</h3>
                      <p className="text-sm ui-text-secondary font-medium">Configure how the Intelligence Layer audits and assists users.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Alert Threshold (RPN)</label>
                           <span className="text-xs font-black text-[#007aff] px-3 py-1 bg-blue-50 rounded-lg">125</span>
                        </div>
                        <input type="range" min="50" max="300" step="5" className="w-full h-1.5 bg-slate-100 rounded-full accent-[#007aff]" />
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">AI will force a "High Risk" warning if the calculated RPN exceeds this baseline.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliance Sensitivity</label>
                           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">IATF OPTIMIZED</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                           <button className="py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400">LAX</button>
                           <button className="py-2.5 bg-[#007aff] text-white border-2 border-white rounded-xl text-[10px] font-black shadow-lg">BALANCED</button>
                           <button className="py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400">STRICT</button>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Knowledge Context Window</label>
                        <div className="p-5 bg-white border border-slate-100 rounded-2xl space-y-3">
                           <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked readOnly className="apple-checkbox h-4 w-4" />
                              <span className="text-xs font-bold text-slate-700">Include Historical SDA Archive</span>
                           </label>
                           <label className="flex items-center gap-3 cursor-pointer opacity-40">
                              <input type="checkbox" disabled className="apple-checkbox h-4 w-4" />
                              <span className="text-xs font-bold text-slate-700">Live Webasto ERP Telemetry (Coming Soon)</span>
                           </label>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-900 rounded-[28px] text-white/90 space-y-4">
                         <div className="flex items-center gap-3 text-emerald-400">
                            <i className="fa-solid fa-microchip"></i>
                            <span className="text-[10px] font-black uppercase tracking-widest">Compute Engine</span>
                         </div>
                         <p className="text-[11px] font-medium text-white/40">Powered by AI. Model behavior is limited by Webasto Data Sovereignty policies.</p>
                         <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Test Model Connectivity</button>
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center text-xs">
                         <i className="fa-solid fa-triangle-exclamation"></i>
                      </div>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Global policy update requires secondary approval</p>
                   </div>
                   <div className="flex gap-4">
                      <button className="apple-btn-secondary px-6">Discard</button>
                      <button className="apple-btn-primary px-10">Commit Settings</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {adminSection === 'settings' && (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* System Configuration */}
            <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                  <i className="fa-solid fa-gear text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold ui-heading">System Configuration</h3>
                  <p className="text-xs ui-text-secondary mt-1">Global application settings and preferences</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold ui-heading">Application Name</label>
                    <input type="text" value="Webasto SDA - Deviation AI:PPROVAL" className="apple-input" readOnly />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold ui-heading">Version</label>
                    <input type="text" value="v2.1.0" className="apple-input" readOnly />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-sm font-bold ui-heading">System URL</label>
                    <input type="text" value="https://sda.webasto.com" className="apple-input" readOnly />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/20 dark:border-white/10">
                  <h4 className="text-sm font-extrabold ui-heading mb-4">Notification Settings</h4>
                  <div className="space-y-4">
                    <label className="apple-toggle flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-bold ui-text-primary">Email Notifications</span>
                        <p className="text-xs ui-text-secondary mt-1">Receive email alerts for approvals and updates</p>
                      </div>
                      <input type="checkbox" className="apple-checkbox" defaultChecked />
                    </label>
                    <label className="apple-toggle flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-bold ui-text-primary">Slack Integration</span>
                        <p className="text-xs ui-text-secondary mt-1">Send approval requests to Slack channels</p>
                      </div>
                      <input type="checkbox" className="apple-checkbox" defaultChecked />
                    </label>
                    <label className="apple-toggle flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-bold ui-text-primary">Teams Integration</span>
                        <p className="text-xs ui-text-secondary mt-1">Send approval requests to Microsoft Teams</p>
                      </div>
                      <input type="checkbox" className="apple-checkbox" />
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/20 dark:border-white/10">
                  <h4 className="text-sm font-extrabold ui-heading mb-4">Compliance Settings</h4>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-sm font-bold ui-heading">PDF/A Compliance Level</label>
                      <select className="apple-input apple-select w-full">
                        <option>Level B (ISO 19005-1:2005)</option>
                        <option>Level A (ISO 19005-2:2011)</option>
                      </select>
                    </div>
                    <label className="apple-toggle flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-bold ui-text-primary">Auto-Archive Completed</span>
                        <p className="text-xs ui-text-secondary mt-1">Automatically archive deviations after closure</p>
                      </div>
                      <input type="checkbox" className="apple-checkbox" defaultChecked />
                    </label>
                    <label className="apple-toggle flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-bold ui-text-primary">IATF 16949 Mode</span>
                        <p className="text-xs ui-text-secondary mt-1">Enable IATF 16949 compliance requirements</p>
                      </div>
                      <input type="checkbox" className="apple-checkbox" defaultChecked />
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/20 dark:border-white/10">
                  <h4 className="text-sm font-extrabold ui-heading mb-4">Data Retention</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold ui-heading">Archive Retention Period</label>
                      <select className="apple-input apple-select w-full">
                        <option>5 years (Recommended)</option>
                        <option>3 years</option>
                        <option>7 years</option>
                        <option>10 years</option>
                        <option>Indefinite</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold ui-heading">Draft Cleanup Period</label>
                      <select className="apple-input apple-select w-full">
                        <option>90 days</option>
                        <option>30 days</option>
                        <option>180 days</option>
                        <option>Never</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20 dark:border-white/10 flex justify-end gap-4">
                <button className="apple-btn-secondary px-6">Reset to Defaults</button>
                <button className="apple-btn-primary px-10">Save Settings</button>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <i className="fa-solid fa-file-lines text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold ui-heading">Audit Logs</h3>
                    <p className="text-xs ui-text-secondary mt-1">System activity and configuration changes</p>
                  </div>
                </div>
                <button className="apple-btn-secondary px-4 py-2 text-xs flex items-center gap-2">
                  <i className="fa-solid fa-download"></i>
                  <span>Export Logs</span>
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { action: 'System configuration updated', user: 'George Neacsu', time: '2 hours ago', type: 'config' },
                  { action: 'User role changed: Marcus Weber → Approver', user: 'George Neacsu', time: '1 day ago', type: 'user' },
                  { action: 'AI governance threshold updated: RPN 120 → 125', user: 'George Neacsu', time: '2 days ago', type: 'ai' },
                  { action: 'Routing matrix policy modified', user: 'Admin System', time: '3 days ago', type: 'matrix' },
                  { action: 'New user invited: Yuki Tanaka', user: 'George Neacsu', time: '5 days ago', type: 'user' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/10 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      log.type === 'config' ? 'bg-purple-100 dark:bg-purple-900/25 text-purple-600 dark:text-purple-400' :
                      log.type === 'user' ? 'bg-blue-100 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400' :
                      log.type === 'ai' ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400' :
                      'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400'
                    }`}>
                      <i className={`fa-solid ${
                        log.type === 'config' ? 'fa-gear' :
                        log.type === 'user' ? 'fa-user' :
                        log.type === 'ai' ? 'fa-brain' :
                        'fa-route'
                      } text-xs`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold ui-text-primary">{log.action}</p>
                      <p className="text-xs ui-text-secondary mt-0.5">by {log.user} • {log.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10 text-center">
                <button className="text-xs font-black uppercase tracking-widest ui-text-tertiary hover:ui-text-secondary transition-colors">
                  Load More Logs
                </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderNewDeviation = () => (
    <div className="flex flex-col lg:flex-row lg:items-stretch gap-8 max-w-[1800px] mx-auto w-full">
      <div className="flex-[2] glass glass-highlight spotlight rounded-[32px] shadow-xl flex flex-col hover-lift">
        <div className="p-10 shrink-0">
          <div className="max-w-5xl mx-auto w-full">
            {/* Header Row - Title on Left, Timeline and Buttons on Right */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              {/* Title on Left */}
              <div className="flex-1">
                <h2 className="text-3xl font-extrabold ui-heading mb-2">{deviation.id}</h2>
                <p className="text-sm font-medium ui-text-secondary">
                  {deviation.masterData.description || `${deviation.deviationType} Deviation Approval Request`}
                </p>
          </div>

              {/* Right Side - Timeline and Buttons */}
              <div className="flex flex-col gap-4">
                {/* Approval Timeline - Start from Status position */}
                <div className="w-full">
                  <ApprovalTimeline deviation={deviation} compact={true} recentActions={recentActions} />
                </div>

                {/* Buttons Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
                  {(() => {
                    const pill = getStatusPill(deviation.status);
                    return (
                      <div className={pill.className}>
                        Status: {pill.label}
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      className="footer-pill footer-pill-danger"
                      onClick={handleDiscard}
                    >
                      Discard
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      disabled={exportingPDF}
                      className="footer-pill footer-pill-muted flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {exportingPDF ? (
                        <>
                          <i className="fa-solid fa-circle-notch animate-spin"></i>
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-file-pdf"></i>
                          <span>Export PDF/A</span>
                        </>
                      )}
                    </button>
                    <button 
                      className="footer-pill footer-pill-muted"
                      onClick={() => setConfirmationModal({ isOpen: true, type: 'save' })}
                    >
                      Save Draft
                    </button>
                    <button 
                      className="footer-pill footer-pill-primary" 
                      onClick={() => {
                        const hasBlocking = conflictAlerts.some(c => c.severity === 'blocking');
                        if (hasBlocking) {
                          alert('Cannot submit: Blocking conflicts detected. Please review and resolve conflicts before submission.');
                          return;
                        }
                        setConfirmationModal({ isOpen: true, type: 'submit' });
                      }}
                      disabled={conflictAlerts.some(c => c.severity === 'blocking')}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="segmented-control grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
            {['classification', 'master', 'details', 'risks', 'actions', 'approvals'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFormTab(tab)}
                  className={`seg-btn ${activeFormTab === tab ? 'seg-btn-active' : 'seg-btn-inactive'}`}
                >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        </div>
        <div className="px-10 pb-10">
          <div className="max-w-5xl mx-auto w-full">
            {activeFormTab === 'classification' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField label="Language" description={FIELD_DESCRIPTIONS.language}>
                    <select value={deviation.classification.language} onChange={(e) => updateClassification('language', e.target.value)} className="apple-input apple-select required-field">
                    <option value="English">English</option>
                    <option value="Deutsch">Deutsch</option>
                    <option value="日本語">日本語</option>
                  </select>
                </FormField>
                <FormField label="Business Unit" description={FIELD_DESCRIPTIONS.bu}>
                  <select value={deviation.classification.bu} onChange={(e) => updateClassification('bu', e.target.value)} className="apple-input apple-select required-field">
                    {BUs.map(bu => <option key={bu} value={bu}>{bu}</option>)}
                  </select>
                </FormField>
                <FormField label="Trigger" className="sm:col-span-2" description={FIELD_DESCRIPTIONS.trigger}>
                  <select value={deviation.classification.trigger} onChange={(e) => updateClassification('trigger', e.target.value)} className="apple-input apple-select required-field">
                    {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Duration Category" className="sm:col-span-2" description={FIELD_DESCRIPTIONS.duration}>
                  <select value={deviation.classification.duration} onChange={(e) => updateClassification('duration', e.target.value)} className="apple-input apple-select required-field">
                    {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FormField>
              </div>
              
              {/* Multi-Lingual Translation */}
              <div className="glass glass-highlight rounded-[24px] p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold ui-heading mb-1">Technical Translation</h4>
                    <p className="text-[10px] font-medium ui-text-secondary">Translate the deviation while preserving technical terms.</p>
                  </div>
                  <div className="h-10 w-10 bg-[#007aff] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
                    <i className="fa-solid fa-language"></i>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(['English', 'Deutsch', '日本語'] as SupportedLanguage[]).filter(lang => lang !== deviation.classification.language).map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleTranslate(lang)}
                      disabled={translating}
                      className="apple-btn-secondary flex-1 px-4 py-2.5 text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {translating ? (
                        <>
                          <i className="fa-solid fa-circle-notch animate-spin"></i>
                          <span>Translating...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-arrow-right"></i>
                          <span>Translate to {lang}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
                {translationResult && (
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/25 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-check-circle text-emerald-600 dark:text-emerald-400 text-xs transition-colors"></i>
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest transition-colors">Translation Complete</span>
                    </div>
                    <p className="text-[10px] font-medium text-emerald-700/90 dark:text-emerald-300 transition-colors">
                      Confidence: {Math.round(translationResult.confidence * 100)}% • {translationResult.termsPreserved.length} technical terms preserved
                    </p>
                  </div>
                )}
              </div>
              </div>
            )}
            {activeFormTab === 'master' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <button 
                  onClick={fetchERPData} 
                  className="sm:col-span-2 px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 self-end ml-auto w-fit bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl border border-blue-400 dark:border-blue-600 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02]"
                >
                  <i className="fa-solid fa-arrows-rotate text-xs"></i>
                  <span>Sync SAP ERP</span>
                </button>
                <FormField label="Material No."><input type="text" className="apple-input required-field" value={deviation.masterData.materialNo} onChange={e => updateMasterData('materialNo', e.target.value)} /></FormField>
                {deviation.deviationType === 'Supplier' ? (
                  <>
                    <FormField label="Supplier Ident No." description="Unique supplier identifier">
                      <input type="text" className="apple-input" value={deviation.masterData.supplierIdent || ''} onChange={e => updateMasterData('supplierIdent', e.target.value)} placeholder="SUP-XXXX" />
                    </FormField>
                    <FormField label="Supplier Name" description={FIELD_DESCRIPTIONS.supplierName}>
                      <input type="text" className="apple-input required-field" value={deviation.masterData.supplierName || ''} onChange={e => updateMasterData('supplierName', e.target.value)} placeholder="Enter supplier name" />
                    </FormField>
                  </>
                ) : (
                  <>
                    <FormField label="Customer Ident No." description="Unique customer identifier">
                      <input type="text" className="apple-input" value={deviation.masterData.customerIdent || ''} onChange={e => updateMasterData('customerIdent', e.target.value)} placeholder="CUST-XXXX" />
                    </FormField>
                    <FormField label="Customer Name" description="The legal entity name of the customer">
                      <input type="text" className="apple-input required-field" value={deviation.masterData.customerName || ''} onChange={e => updateMasterData('customerName', e.target.value)} placeholder="Enter customer name" />
                    </FormField>
                    <FormField label="Customer Contact" description="Primary contact person at customer">
                      <input type="text" className="apple-input" value={deviation.masterData.customerContact || ''} onChange={e => updateMasterData('customerContact', e.target.value)} placeholder="Name, Email, Phone" />
                    </FormField>
                    <FormField label="Customer Project Code" description="Customer's internal project or order reference">
                      <input type="text" className="apple-input" value={deviation.masterData.customerProjectCode || ''} onChange={e => updateMasterData('customerProjectCode', e.target.value)} placeholder="Project/Order code" />
                    </FormField>
                  </>
                )}
                <FormField label="Webasto Plant">
                  <select className="apple-input apple-select required-field" value={deviation.masterData.plant} onChange={e => updateMasterData('plant', e.target.value)}>
                    {PLANTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </FormField>
                <FormField label="Expiration Date">
                  <div className="relative">
                    <input 
                      type="date" 
                      className="apple-input pl-10 required-field" 
                      value={deviation.masterData.expirationDate} 
                      onChange={e => updateMasterData('expirationDate', e.target.value)} 
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <i className="fa-solid fa-calendar text-slate-500 dark:text-slate-400 text-sm"></i>
                    </div>
                  </div>
                </FormField>
                <label className="apple-toggle sm:col-span-2">
                   <span className="font-bold text-sm ui-text-primary">Product Safety Relevant</span>
                   <input type="checkbox" className="apple-checkbox" checked={deviation.masterData.productSafetyRelevant} onChange={e => updateMasterData('productSafetyRelevant', e.target.checked)} />
                </label>
                <FormField label="Product Safety Comment" className="sm:col-span-2">
                  <textarea 
                    className="apple-input min-h-[100px] resize-y" 
                    placeholder="Add comments or notes regarding product safety relevance..."
                    value={deviation.masterData.productSafetyComment || ''} 
                    onChange={e => updateMasterData('productSafetyComment', e.target.value)} 
                  />
                </FormField>
              </div>
            )}
            {activeFormTab === 'details' && (
              <div className="space-y-8">
                {/* Conflict Alerts */}
                {conflictAlerts.length > 0 && (
                  <div className="glass rounded-[24px] border-2 border-red-200 p-6 bg-gradient-to-br from-red-50/50 to-transparent">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-500 rounded-2xl flex items-center justify-center text-white">
                          <i className="fa-solid fa-shield-exclamation"></i>
              </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-red-700">Similarity Conflict Detection</h4>
                          <p className="text-[10px] font-medium text-red-600">
                            {checkingConflicts ? 'Checking...' : `${conflictAlerts.length} conflict(s) detected`}
                          </p>
                        </div>
                      </div>
                      {checkingConflicts && (
                        <i className="fa-solid fa-circle-notch animate-spin text-red-500"></i>
                      )}
                    </div>
                    <ConflictAlertsPanel
                      conflicts={conflictAlerts}
                      onDismiss={(index) => {
                        setConflictAlerts(prev => prev.filter((_, i) => i !== index));
                      }}
                      onViewDetails={(deviationId) => {
                        // In production, navigate to deviation details
                        alert(`View details for ${deviationId}`);
                      }}
                    />
                  </div>
                )}

                <FormField label="Specification Requirement"><textarea rows={5} className="apple-input resize-none required-field" value={deviation.details.specification} onChange={e => updateDetails('specification', e.target.value)} /></FormField>
                <FormField label="Deviation Details"><textarea rows={5} className="apple-input resize-none required-field" value={deviation.details.deviation} onChange={e => updateDetails('deviation', e.target.value)} /></FormField>

                <VisionUpload
                  deviation={deviation}
                  onAddRisks={(risks) => setDeviation(prev => ({ ...prev, risks: [...prev.risks, ...risks] }))}
                />
              </div>
            )}
            {activeFormTab === 'risks' && <RiskTable risks={deviation.risks} onUpdate={risks => setDeviation(prev => ({ ...prev, risks }))} deviation={deviation} />}
            {activeFormTab === 'actions' && (
              <div className="space-y-10">
                <ActionTable actions={deviation.actions} type="Immediate" onUpdate={actions => setDeviation(prev => ({ ...prev, actions }))} deviation={deviation} />
                <ActionTable actions={deviation.actions} type="Corrective" onUpdate={actions => setDeviation(prev => ({ ...prev, actions }))} deviation={deviation} />
                <EightDGenerator deviation={deviation} />
              </div>
            )}
            {activeFormTab === 'approvals' && (
              <div className="space-y-6">
                <ApprovalTimeline deviation={deviation} compact={false} recentActions={recentActions} />
                <div className="glass p-5 rounded-[24px] mb-2">
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-route text-[#007aff] dark:text-[#60a5fa] text-lg mt-0.5"></i>
                    <p className="text-xs ui-text-secondary leading-relaxed">
                      <strong className="ui-text-primary font-bold">Approval Routing:</strong> Based on Business Unit, Trigger Code, and Duration Category. The workflow is automatically calculated.
                    </p>
                  </div>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {deviation.approvals.map(step => (
                    <div key={step.id} className="glass glass-highlight spotlight p-5 rounded-[24px] hover-lift transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-[10px] font-black ui-label mb-2">{step.role}</p>
                          <p className="text-sm font-bold ui-text-primary">{step.status === 'Pending' ? 'TBD' : step.status}</p>
                      </div>
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full ${
                          step.status === 'Pending' 
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                            : step.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      {step.comments && (
                        <p className="text-xs ui-text-secondary mt-2 italic">{step.comments}</p>
                      )}
                   </div>
                 ))}
              </div>
                
                {/* Adaptive Cards Section */}
                {deviation.approvals.some(s => s.status === 'Pending') && (
                  <div className="mt-8">
                    <h3 className="text-lg font-extrabold ui-heading mb-4">Send Approval Request via Chat</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {deviation.approvals
                        .filter(step => step.status === 'Pending')
                        .map(step => (
                          <div key={step.id}>
                            <AdaptiveCardPreview
                              deviation={deviation}
                              approver={step.role}
                              stepId={step.id}
                              deviationType={deviationType}
                              onSend={async (platform) => {
                                const service = new AdaptiveCardsService();
                                if (platform === 'teams') {
                                  await service.sendToTeams(deviation, `${step.role}@webasto.com`, step.id);
                                } else {
                                  await service.sendToSlack(deviation, step.role.toLowerCase().replace(/\s+/g, '.'), step.id, '#approvals');
                                }
                              }}
                            />
          </div>
                        ))}
        </div>
          </div>
                )}
        </div>
            )}
      </div>
        </div>
        {/* actions moved to header beside Status */}
      </div>
      <div className="w-full lg:w-[400px] shrink-0 self-stretch">
         <AIAssistant data={aiAnalysis} loading={loadingAI} onAnalyze={handleAIAnalysis} redactionMode={redactionMode} setRedactionMode={setRedactionMode} deviation={deviation} />
      </div>
    </div>
  );

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAIPanelOpen={() => setIsAIPanelOpen(true)}
        deviationType={deviationType}
        onDeviationTypeChange={(type) => {
          setDeviationType(type);
          if (activeTab === 'new') {
            updateDeviationType(type);
          }
        }}
      >
      <div className="h-full">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'new' && renderNewDeviation()}
        {activeTab === 'approvals' && renderApprovals()}
        {activeTab === 'archive' && renderArchive()}
        {activeTab === 'compliance' && renderCompliance()}
          {activeTab === 'faq' && <FAQ />}
        {activeTab === 'admin' && renderAdmin()}
      </div>
    </Layout>
      <OfflineIndicator 
        onSyncComplete={(result) => {
          if (result.success > 0) {
            console.log(`[PWA] Synced ${result.success} actions successfully`);
          }
        }}
      />
      {/* Global AI Panel - accessible from header */}
      <GlobalAIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        deviation={activeTab === 'new' ? deviation : undefined}
        aiAnalysis={activeTab === 'new' ? aiAnalysis : undefined}
        loadingAI={loadingAI}
        onAnalyze={activeTab === 'new' ? handleAIAnalysis : undefined}
        redactionMode={redactionMode}
        setRedactionMode={activeTab === 'new' ? setRedactionMode : undefined}
        onDeviationUpdate={activeTab === 'new' ? (updates) => {
          setDeviation({ ...deviation, ...updates });
        } : undefined}
      />
      {/* Voice Assistant - only on New Deviation page (floating button) */}
      {activeTab === 'new' && (
        <VoiceAssistant 
          deviation={deviation}
          onUpdate={(updates) => {
            setDeviation({ ...deviation, ...updates });
          }}
        />
      )}
      {/* Confirmation Modal for Save Draft and Submit */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, type: null })}
        onConfirm={() => {
          if (confirmationModal.type === 'save') {
            handleSaveDraft();
          } else if (confirmationModal.type === 'submit') {
            handleSubmit();
          }
        }}
        title={confirmationModal.type === 'save' ? 'Save Draft' : 'Submit Deviation'}
        message={
          confirmationModal.type === 'save'
            ? 'Are you sure you want to save this deviation as a draft? You can continue editing it later.'
            : 'Are you sure you want to submit this deviation for approval? Once submitted, it will enter the approval workflow.'
        }
        confirmText={confirmationModal.type === 'save' ? 'Save Draft' : 'Submit'}
        cancelText="Cancel"
        type={confirmationModal.type === 'save' ? 'info' : 'success'}
      />
    </>
  );
};

const StatCard = ({ title, value, trend, icon, color }: any) => (
  <div className="glass glass-highlight spotlight p-8 rounded-[32px] relative overflow-hidden group hover-lift cursor-pointer">
    <div className="flex items-start justify-between gap-4 relative z-10">
      <div className="min-w-0">
        <span className="text-[10px] font-black uppercase tracking-widest ui-text-tertiary">{title}</span>
        <div className="mt-4">
          <div className={`text-4xl font-extrabold ${color}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.16)' }}>
            {value}
      </div>
          <div className="ui-text-secondary text-[10px] font-bold mt-1 uppercase tracking-widest">
            {trend}
    </div>
        </div>
      </div>

      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-2xl border border-white/40 dark:border-white/10 bg-white/35 dark:bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_14px_34px_rgba(0,0,0,0.10)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-transform">
          <i className={`fa-solid ${icon} text-lg ${color}`}></i>
        </div>
        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity ${color}`} />
      </div>
    </div>

    {/* Glass highlight effect */}
    <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/18 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
  </div>
);

export default App;