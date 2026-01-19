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

// Mock Data
const MOCK_APPROVALS = [
  { 
    id: 'DAI_ET-2026-8816', 
    title: 'Housing dimensional deviation', 
    supplier: 'Bosch Global', 
    bu: 'ET', 
    rpn: 150, 
    urgency: 'Critical', 
    pendingDays: 2, 
    step: 'R&D Director Review',
    material: '882-103-X'
  },
  { 
    id: 'DAI_RB-2026-1102', 
    title: 'Software logic mismatch in control unit', 
    supplier: 'Continental AG', 
    bu: 'RB', 
    rpn: 80, 
    urgency: 'Medium', 
    pendingDays: 4, 
    step: 'Project Manager Sign-off',
    material: 'RB-X102-S'
  },
  { 
    id: 'DAI_RX-2026-0552', 
    title: 'PPAP Documentation Missing (Samples only)', 
    supplier: 'ZF Friedrichshafen', 
    bu: 'RX', 
    rpn: 42, 
    urgency: 'Low', 
    pendingDays: 1, 
    step: 'Quality Engineer Approval',
    material: 'RX-PZ-991'
  }
];

const MOCK_HISTORY = [
  { id: 'DAI_ET-2025-1105', material: '882-103-X', supplier: 'Bosch Global', BU: BU.ET, rpn: 45, date: '2025-11-12', status: WorkflowStatus.Approved },
  { id: 'DAI_RB-2025-0988', material: 'RB-X102-S', supplier: 'Continental AG', BU: BU.RB, rpn: 110, date: '2025-10-05', status: WorkflowStatus.Approved },
  { id: 'DAI_RX-2025-0441', material: 'RX-PZ-991', supplier: 'ZF Friedrichshafen', BU: BU.RX, rpn: 160, date: '2025-09-20', status: WorkflowStatus.Rejected },
  { id: 'DAI_EB-2025-3102', material: 'EB-772-L', supplier: 'LG Chem', BU: BU.EB, rpn: 35, date: '2025-08-15', status: WorkflowStatus.Approved }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deviation, setDeviation] = useState<DeviationRecord>(initialDeviation());
  const [aiAnalysis, setAIAnalysis] = useState<AIResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [redactionMode, setRedactionMode] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('classification');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [isDecisionSubmitting, setIsDecisionSubmitting] = useState(false);
  const [adminSection, setAdminSection] = useState<'users' | 'matrix' | 'ai'>('users');
  const [translating, setTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{ confidence: number; termsPreserved: string[] } | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [conflictAlerts, setConflictAlerts] = useState<ConflictAlert[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const conflictDetectionService = React.useMemo(() => new ConflictDetectionService(), []);
  const conflictCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const offlineService = React.useMemo(() => new OfflineService(), []);

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
      if (field === 'materialNo' || field === 'supplierName' || field === 'plant') {
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
      updateMasterData('supplierName', 'BOSCH Global Components');
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

  const renderDashboard = () => (
    <div className="space-y-8 animate-slide-in max-w-[1600px] mx-auto">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Deviations" value="124" trend="+12% vs last month" icon="fa-chart-line" color="text-[#007aff] dark:text-[#60a5fa]" />
          <StatCard title="Pending Approvals" value="3" trend="2 urgent" icon="fa-clock" color="text-amber-600 dark:text-amber-400" />
          <StatCard title="Avg. Cycle Time" value="4.2d" trend="-0.8d improved" icon="fa-bolt" color="text-emerald-600 dark:text-emerald-400" />
          <StatCard title="Compliance Risk Score" value="92" trend="Compliance: High" icon="fa-shield-halved" color="text-purple-600 dark:text-purple-400" />
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 glass glass-highlight spotlight rounded-[32px] p-8 space-y-10 hover-lift">
             <h2 className="text-2xl font-extrabold ui-heading" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Performance Analytics</h2>
             <AnalyticsCharts />
          </div>
          <div className="glass glass-highlight spotlight rounded-[32px] p-8 shadow-sm flex flex-col hover-lift">
             <ActivityFeed />
          </div>
       </div>
       
       {/* Advanced Analytics - Risk Heatmap */}
       <RiskHeatmap />
    </div>
  );

  const renderApprovals = () => {
    if (selectedApprovalId) {
      const selected = MOCK_APPROVALS.find(a => a.id === selectedApprovalId);
      return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-slide-in">
          <button onClick={() => setSelectedApprovalId(null)} className="flex items-center gap-2 text-[#007aff] font-bold text-sm hover:translate-x-[-4px] transition-transform">
             <i className="fa-solid fa-arrow-left"></i> Back to Queue
          </button>
          <div className="flex flex-col xl:flex-row gap-8">
               <div className="flex-1 glass rounded-[32px] border border-white/50 p-8 space-y-8">
                <h2 className="text-2xl font-black ui-heading dark:text-slate-100 transition-colors">{selected?.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   <div className="space-y-1">
                      <p className="ui-label">Supplier</p>
                      <p className="text-sm font-bold ui-text-primary">{selected?.supplier}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="ui-label">Material</p>
                      <p className="text-sm font-bold ui-text-primary">{selected?.material}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="ui-label">RPN Score</p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 transition-colors">{selected?.rpn}</p>
                   </div>
                </div>
             </div>
             <div className="w-full xl:w-96 glass rounded-[32px] border border-white/50 p-8 shadow-xl">
               <h3 className="text-lg font-extrabold ui-heading dark:text-slate-100 mb-6 transition-colors">Decision Center</h3>
                <textarea 
                  className="apple-input mb-4" 
                  rows={4} 
                  placeholder="Justification..."
                  value={decisionComment}
                  onChange={e => setDecisionComment(e.target.value)}
                />
                <button 
                  disabled={isDecisionSubmitting}
                  onClick={() => { setIsDecisionSubmitting(true); setTimeout(() => { setSelectedApprovalId(null); setIsDecisionSubmitting(false); }, 1000); }}
                  className="apple-btn-success mb-3"
                >
                  {isDecisionSubmitting ? 'Submitting...' : 'Approve'}
                </button>
                <button className="apple-btn-danger">Reject</button>
             </div>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-[1400px] mx-auto space-y-8 animate-slide-in">
        <h2 className="text-3xl font-extrabold ui-heading dark:text-slate-100 transition-colors">Approvals Queue</h2>
        <div className="grid grid-cols-1 gap-4">
           {MOCK_APPROVALS.map(a => (
              <div key={a.id} onClick={() => setSelectedApprovalId(a.id)} className="glass glass-highlight spotlight p-6 rounded-[32px] hover-lift hover-glow transition-all cursor-pointer flex justify-between items-center group">
                 <div>
                    <span className="text-[10px] font-black ui-text-secondary uppercase">{a.id}</span>
                    <h3 className="text-lg font-black ui-text-primary">{a.title}</h3>
                 </div>
                 <i className="fa-solid fa-chevron-right ui-text-tertiary group-hover:text-[#007aff] group-hover:translate-x-1 transition-all"></i>
              </div>
           ))}
        </div>
        <div className="p-8 bg-slate-900 rounded-[32px]">
           <p className="text-white font-bold">Batch Approval Mode</p>
           <p className="text-white/40 text-xs">Available for RPN {"<"} 40.</p>
        </div>
      </div>
    );
  };

  const renderArchive = () => (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-slide-in">
       <h2 className="text-3xl font-extrabold ui-heading dark:text-slate-100 transition-colors">Historical Records</h2>
       <div className="glass glass-highlight spotlight rounded-[32px] overflow-hidden hover-lift">
          <table className="w-full text-left">
             <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 transition-colors">
                <tr>
                   <th className="px-8 py-5 text-[10px] font-black uppercase ui-label">ID</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase ui-label">Component</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase ui-label">RPN</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase ui-label">Status</th>
                </tr>
             </thead>
             <tbody>
                {MOCK_HISTORY.map(h => (
                   <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-sm">{h.id}</td>
                      <td className="px-8 py-5 text-xs ui-text-secondary">{h.material}</td>
                      <td className={`px-8 py-5 font-bold text-xs ${h.rpn >= 125 ? 'text-red-500' : h.rpn >= 60 ? 'text-amber-500' : 'ui-text-primary'}`}>
                        {h.rpn}
                      </td>
                      <td className="px-8 py-5">
                        {(() => {
                          const pill = getStatusPill(h.status);
                          return (
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${pill.className}`}>
                              {pill.label}
                            </span>
                          );
                        })()}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-slide-in">
       <h2 className="text-3xl font-extrabold ui-heading dark:text-slate-100 transition-colors">Audit Readiness Center</h2>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] text-center hover-lift">
             <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400 transition-colors">92.4%</p>
             <p className="text-[10px] font-black ui-label mt-2">Documentation Health</p>
          </div>
          <div className="glass glass-highlight spotlight p-6 rounded-[32px] text-center hover-lift">
             <p className="text-2xl font-black text-amber-500 dark:text-amber-400 transition-colors">88.1%</p>
             <p className="text-[10px] font-black ui-label mt-2">CA Closure</p>
          </div>
       </div>
    </div>
  );

  const renderAdmin = () => {
    return (
      <div className="max-w-7xl mx-auto space-y-10 animate-slide-in pb-20">
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
      </div>
    );
  };

  const renderNewDeviation = () => (
    <div className="flex flex-col lg:flex-row lg:items-stretch gap-8 animate-slide-in max-w-[1800px] mx-auto w-full">
      <div className="flex-[2] glass glass-highlight spotlight rounded-[32px] shadow-xl flex flex-col hover-lift">
        <div className="p-10 shrink-0">
          <div className="max-w-5xl mx-auto w-full">
            {/* Header Row - Title on Left, Timeline and Buttons on Right */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              {/* Title on Left */}
              <div className="flex-1">
                <h2 className="text-3xl font-extrabold ui-heading">{deviation.id}</h2>
                <p className="text-sm font-medium ui-text-secondary mt-1">
                  {deviation.masterData.description || 'Supplier Deviation Approval Request'}
                </p>
              </div>

              {/* Right Side - Timeline and Buttons */}
              <div className="flex flex-col gap-4">
                {/* Approval Timeline - Start from Status position */}
                <div className="w-full">
                  <ApprovalTimeline deviation={deviation} compact={true} />
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
                    <button className="footer-pill footer-pill-danger">
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
                      onClick={async () => {
                        try {
                          await offlineService.saveOffline(deviation);
                          await offlineService.queueAction('update', deviation);
                          alert('Draft saved' + (navigator.onLine ? '' : ' (will sync when online)'));
                        } catch (error) {
                          console.error('Failed to save draft:', error);
                          alert('Failed to save draft. Please try again.');
                        }
                      }}
                    >
                      Save Draft
                    </button>
                    <button 
                      className="footer-pill footer-pill-primary" 
                      onClick={async () => {
                        const hasBlocking = conflictAlerts.some(c => c.severity === 'blocking');
                        if (hasBlocking) {
                          alert('Cannot submit: Blocking conflicts detected. Please review and resolve conflicts before submission.');
                          return;
                        }
                        
                        // Queue submission action
                        try {
                          await offlineService.queueAction('update', { ...deviation, status: WorkflowStatus.Submitted });
                          if (navigator.onLine) {
                            // In production, would make API call here
                            setActiveTab('approvals');
                          } else {
                            alert('Submission queued. Will be processed when online.');
                          }
                        } catch (error) {
                          console.error('Failed to queue submission:', error);
                          alert('Failed to submit. Please try again.');
                        }
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
                    <select value={deviation.classification.language} onChange={(e) => updateClassification('language', e.target.value)} className="apple-input apple-select">
                      <option value="English">English</option>
                      <option value="Deutsch">Deutsch</option>
                      <option value="日本語">日本語</option>
                    </select>
                  </FormField>
                <FormField label="Business Unit" description={FIELD_DESCRIPTIONS.bu}>
                  <select value={deviation.classification.bu} onChange={(e) => updateClassification('bu', e.target.value)} className="apple-input apple-select">
                    {BUs.map(bu => <option key={bu} value={bu}>{bu}</option>)}
                  </select>
                </FormField>
                <FormField label="Trigger" className="sm:col-span-2" description={FIELD_DESCRIPTIONS.trigger}>
                  <select value={deviation.classification.trigger} onChange={(e) => updateClassification('trigger', e.target.value)} className="apple-input apple-select">
                    {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Duration Category" className="sm:col-span-2" description={FIELD_DESCRIPTIONS.duration}>
                  <select value={deviation.classification.duration} onChange={(e) => updateClassification('duration', e.target.value)} className="apple-input apple-select">
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
                <FormField label="Material No."><input type="text" className="apple-input" value={deviation.masterData.materialNo} onChange={e => updateMasterData('materialNo', e.target.value)} /></FormField>
                <FormField label="Supplier Name"><input type="text" className="apple-input" value={deviation.masterData.supplierName} onChange={e => updateMasterData('supplierName', e.target.value)} /></FormField>
                <FormField label="Webasto Plant">
                  <select className="apple-input apple-select" value={deviation.masterData.plant} onChange={e => updateMasterData('plant', e.target.value)}>
                    {PLANTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </FormField>
                <FormField label="Expiration Date">
                  <div className="relative">
                    <input 
                      type="date" 
                      className="apple-input pl-10" 
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

                <FormField label="Specification Requirement"><textarea rows={5} className="apple-input resize-none" value={deviation.details.specification} onChange={e => updateDetails('specification', e.target.value)} /></FormField>
                <FormField label="Deviation Details"><textarea rows={5} className="apple-input resize-none" value={deviation.details.deviation} onChange={e => updateDetails('deviation', e.target.value)} /></FormField>

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
                <ApprovalTimeline deviation={deviation} compact={false} />
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
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
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