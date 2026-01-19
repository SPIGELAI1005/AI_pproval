import React, { useState } from 'react';
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
import { GeminiService } from './services/geminiService';
import { TranslationService, SupportedLanguage } from './services/translationService';
import { PDFExportService } from './services/pdfExportService';

const InfoIcon = ({ text }: { text?: string }) => {
  if (!text) return null;
  return (
    <div className="relative group/info inline-block align-middle ml-1.5">
      <i className="fa-solid fa-circle-info text-[10px] text-slate-300 hover:text-[#007aff] transition-colors cursor-help"></i>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-white rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-slate-100 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[100] pointer-events-none">
        <div className="text-[10px] font-bold text-slate-800 leading-relaxed mb-1 uppercase tracking-widest border-b border-slate-50 pb-2 text-left">Information</div>
        <p className="text-[10px] font-medium text-slate-500 leading-relaxed text-left normal-case">
          {text}
        </p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
      </div>
    </div>
  );
};

const FormField = ({ label, children, className = "", description }: { label: string; children?: React.ReactNode; className?: string; description?: string }) => (
  <div className={`space-y-1.5 group min-w-0 ${className}`}>
    <div className="flex items-center px-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block transition-colors group-focus-within:text-[#007aff]">
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
      return { ...prev, masterData: updatedMD, approvals: updatedApprovals };
    });
  };

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const gemini = new GeminiService();
      const result = await gemini.analyzeDeviation(deviation, redactionMode);
      setAIAnalysis(result);
    } catch (e) { console.error(e); }
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
          <StatCard title="Total Deviations" value="124" trend="+12% vs last month" icon="fa-chart-line" color="text-[#007aff]" />
          <StatCard title="Pending Approvals" value="3" trend="2 urgent" icon="fa-clock" color="text-amber-500" />
          <StatCard title="Avg. Cycle Time" value="4.2d" trend="-0.8d improved" icon="fa-bolt" color="text-emerald-500" />
          <StatCard title="IATF Risk Score" value="92" trend="Compliance: High" icon="fa-shield-check" color="text-purple-500" />
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 glass rounded-[32px] p-8 border border-white/50 space-y-10">
             <h2 className="text-2xl font-extrabold text-[#00305d]">Performance Analytics</h2>
             <AnalyticsCharts />
          </div>
          <div className="glass rounded-[32px] p-8 border border-white/50 shadow-sm flex flex-col">
             <ActivityFeed />
          </div>
       </div>
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
                <h2 className="text-2xl font-black text-[#00305d]">{selected?.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</p>
                      <p className="text-sm font-bold text-slate-800">{selected?.supplier}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</p>
                      <p className="text-sm font-bold text-slate-800">{selected?.material}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RPN Score</p>
                      <p className="text-sm font-bold text-red-600">{selected?.rpn}</p>
                   </div>
                </div>
             </div>
             <div className="w-full xl:w-96 glass rounded-[32px] border border-white/50 p-8 shadow-xl">
                <h3 className="text-lg font-extrabold text-[#00305d] mb-6">Decision Center</h3>
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
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold mb-3"
                >
                  {isDecisionSubmitting ? 'Submitting...' : 'Approve'}
                </button>
                <button className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold">Reject</button>
             </div>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-[1400px] mx-auto space-y-8 animate-slide-in">
        <h2 className="text-3xl font-extrabold text-[#00305d]">Approvals Queue</h2>
        <div className="grid grid-cols-1 gap-4">
           {MOCK_APPROVALS.map(a => (
              <div key={a.id} onClick={() => setSelectedApprovalId(a.id)} className="glass p-6 rounded-[32px] border hover:border-[#007aff] transition-all cursor-pointer flex justify-between items-center group">
                 <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{a.id}</span>
                    <h3 className="text-lg font-black text-slate-800">{a.title}</h3>
                 </div>
                 <i className="fa-solid fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>
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
       <h2 className="text-3xl font-extrabold text-[#00305d]">Historical Records</h2>
       <div className="glass rounded-[32px] overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                   <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">ID</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Component</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">RPN</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Status</th>
                </tr>
             </thead>
             <tbody>
                {MOCK_HISTORY.map(h => (
                   <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-sm">{h.id}</td>
                      <td className="px-8 py-5 text-xs text-slate-600">{h.material}</td>
                      <td className={`px-8 py-5 font-bold text-xs ${h.rpn >= 125 ? 'text-red-500' : h.rpn >= 60 ? 'text-amber-500' : 'text-slate-700'}`}>
                        {h.rpn}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase shadow-sm ${
                          h.status === WorkflowStatus.Approved ? 'bg-emerald-500 text-white' : 
                          h.status === WorkflowStatus.Rejected ? 'bg-red-600 text-white' : 
                          'bg-slate-500 text-white'
                        }`}>
                          {h.status}
                        </span>
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
       <h2 className="text-3xl font-extrabold text-[#00305d]">Audit Readiness Center</h2>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-[32px] border border-white/50 text-center">
             <p className="text-2xl font-black text-emerald-500">92.4%</p>
             <p className="text-[10px] font-black text-slate-400 uppercase">Documentation Health</p>
          </div>
          <div className="glass p-6 rounded-[32px] border border-white/50 text-center">
             <p className="text-2xl font-black text-amber-500">88.1%</p>
             <p className="text-[10px] font-black text-slate-400 uppercase">CA Closure</p>
          </div>
       </div>
    </div>
  );

  const renderAdmin = () => {
    return (
      <div className="max-w-7xl mx-auto space-y-10 animate-slide-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
             <h2 className="text-3xl font-extrabold text-[#00305d]">Administration Console</h2>
             <p className="text-slate-400 font-medium">Control governance, users, and AI parameters for Global SDA.</p>
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
                   adminSection === sec.id ? 'bg-white text-[#007aff] shadow-md' : 'text-slate-500 hover:text-slate-700'
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
                  <h3 className="text-lg font-black text-slate-800">IAM & Directory</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total active users: 1,402</p>
               </div>
               <button className="apple-btn-primary px-6 py-2.5 text-xs flex items-center gap-2">
                  <i className="fa-solid fa-plus"></i> Invite User
               </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
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
                      <tr key={i} className="hover:bg-white/60 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gradient-to-tr from-slate-200 to-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                                 <i className="fa-solid fa-user-tie"></i>
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                 <p className="text-[10px] text-slate-400">george.neacsu@webasto.com</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.color}`}>
                              {user.role}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-600">{user.bu}</td>
                        <td className="px-8 py-6 text-xs text-slate-400">{user.time}</td>
                        <td className="px-8 py-6 text-right">
                           <button className="h-8 w-8 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-[#007aff] hover:border-[#007aff] transition-all">
                              <i className="fa-solid fa-ellipsis"></i>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
               <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600">Load More Stakeholders</button>
            </div>
          </div>
        )}

        {adminSection === 'matrix' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-2 space-y-8">
                <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                         <h3 className="text-xl font-black text-slate-800">Global Routing Policies</h3>
                         <p className="text-xs text-slate-500 font-medium">Automatic determination of required signatures.</p>
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
                                 <h4 className="text-sm font-black text-slate-800">{rule.title}</h4>
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
                   <h3 className="text-sm font-black text-[#00305d] uppercase tracking-widest mb-6">Matrix Simulator</h3>
                   <div className="space-y-6">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium italic">Test your routing logic by simulating a deviation scenario.</p>
                      
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
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Approvers</h5>
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
                      <h3 className="text-2xl font-black text-[#00305d]">AI Governance & Tuning</h3>
                      <p className="text-sm text-slate-400 font-medium">Configure how the Intelligence Layer audits and assists users.</p>
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
                         <p className="text-[11px] font-medium text-white/40">Powered by <strong>Gemini 3 Pro Preview</strong>. Model behavior is limited by Webasto Data Sovereignty policies.</p>
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
    <div className="flex flex-col lg:flex-row gap-8 animate-slide-in h-full max-w-[1800px] mx-auto w-full">
      <div className="flex-[2] glass rounded-[32px] border border-white/50 shadow-xl flex flex-col overflow-hidden">
        <div className="p-10 shrink-0">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-extrabold text-[#00305d]">{deviation.id}</h2>
            <div className="px-5 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase">Status: DRAFT</div>
          </div>
          <div className="segmented-control flex gap-1">
            {['classification', 'master', 'details', 'risks', 'actions', 'approvals'].map(tab => (
              <button key={tab} onClick={() => setActiveFormTab(tab)} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeFormTab === tab ? 'bg-white text-[#007aff] shadow-sm' : 'text-slate-500'}`}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="max-w-4xl mx-auto">
            {activeFormTab === 'classification' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
              <div className="glass rounded-[24px] border border-white/50 p-6 bg-gradient-to-br from-blue-50/50 to-transparent">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#00305d] mb-1">Technical Translation</h4>
                    <p className="text-[10px] font-medium text-slate-500">Translate entire deviation while preserving technical terms</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                    <i className="fa-solid fa-language"></i>
                  </div>
                </div>
                <div className="flex gap-3">
                  {(['English', 'Deutsch', '日本語'] as SupportedLanguage[]).filter(lang => lang !== deviation.classification.language).map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleTranslate(lang)}
                      disabled={translating}
                      className="flex-1 px-4 py-2.5 bg-white border border-white/80 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-[#007aff] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-check-circle text-emerald-600 text-xs"></i>
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Translation Complete</span>
                    </div>
                    <p className="text-[10px] font-medium text-emerald-600">
                      Confidence: {Math.round(translationResult.confidence * 100)}% • {translationResult.termsPreserved.length} technical terms preserved
                    </p>
                  </div>
                )}
              </div>
            </div>
            )}
            {activeFormTab === 'master' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <button onClick={fetchERPData} className="sm:col-span-2 text-right text-[10px] font-black text-[#007aff] uppercase">Sync SAP ERP</button>
                <FormField label="Material No."><input type="text" className="apple-input" value={deviation.masterData.materialNo} onChange={e => updateMasterData('materialNo', e.target.value)} /></FormField>
                <FormField label="Supplier Name"><input type="text" className="apple-input" value={deviation.masterData.supplierName} onChange={e => updateMasterData('supplierName', e.target.value)} /></FormField>
                <FormField label="Webasto Plant">
                  <select className="apple-input apple-select" value={deviation.masterData.plant} onChange={e => updateMasterData('plant', e.target.value)}>
                    {PLANTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </FormField>
                <FormField label="Expiration Date"><input type="date" className="apple-input" value={deviation.masterData.expirationDate} onChange={e => updateMasterData('expirationDate', e.target.value)} /></FormField>
                <label className="apple-toggle sm:col-span-2">
                   <span className="font-bold text-sm text-slate-700">Product Safety Relevant</span>
                   <input type="checkbox" className="apple-checkbox" checked={deviation.masterData.productSafetyRelevant} onChange={e => updateMasterData('productSafetyRelevant', e.target.checked)} />
                </label>
              </div>
            )}
            {activeFormTab === 'details' && (
              <div className="space-y-8">
                <FormField label="Specification Requirement"><textarea rows={5} className="apple-input resize-none" value={deviation.details.specification} onChange={e => setDeviation(prev => ({ ...prev, details: { ...prev.details, specification: e.target.value } }))} /></FormField>
                <FormField label="Deviation Details"><textarea rows={5} className="apple-input resize-none" value={deviation.details.deviation} onChange={e => setDeviation(prev => ({ ...prev, details: { ...prev.details, deviation: e.target.value } }))} /></FormField>
              </div>
            )}
            {activeFormTab === 'risks' && <RiskTable risks={deviation.risks} onUpdate={risks => setDeviation(prev => ({ ...prev, risks }))} />}
            {activeFormTab === 'actions' && (
              <div className="space-y-10">
                <ActionTable actions={deviation.actions} type="Immediate" onUpdate={actions => setDeviation(prev => ({ ...prev, actions }))} />
                <ActionTable actions={deviation.actions} type="Corrective" onUpdate={actions => setDeviation(prev => ({ ...prev, actions }))} />
              </div>
            )}
            {activeFormTab === 'approvals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {deviation.approvals.map(step => (
                   <div key={step.id} className="p-4 bg-white/60 rounded-2xl border flex justify-between items-center">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">{step.role}</p>
                         <p className="text-xs font-bold text-slate-700">TBD</p>
                      </div>
                      <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded">{step.status}</span>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-10 border-t border-white/50 flex justify-between items-center bg-white/40">
          <button className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500">Discard</button>
          <div className="flex gap-4">
            <button 
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="apple-btn-secondary flex items-center gap-2 disabled:opacity-50"
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
            <button className="apple-btn-secondary">Save Draft</button>
            <button className="apple-btn-primary" onClick={() => setActiveTab('approvals')}>Submit</button>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[400px] shrink-0">
         <AIAssistant data={aiAnalysis} loading={loadingAI} onAnalyze={handleAIAnalysis} redactionMode={redactionMode} setRedactionMode={setRedactionMode} deviation={deviation} />
      </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="h-full">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'new' && renderNewDeviation()}
        {activeTab === 'approvals' && renderApprovals()}
        {activeTab === 'archive' && renderArchive()}
        {activeTab === 'compliance' && renderCompliance()}
        {activeTab === 'admin' && renderAdmin()}
      </div>
      <style>{`
        .apple-input { @apply w-full bg-white/60 border border-white/80 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all outline-none focus:bg-white focus:border-[#007aff]; }
        .apple-toggle { @apply flex items-center justify-between p-5 rounded-[24px] bg-white/40 border border-white/40 hover:bg-white transition-all cursor-pointer; }
        .apple-checkbox { @apply h-6 w-6 rounded-lg border-slate-200 text-[#007aff] focus:ring-[#007aff]; }
        .apple-btn-primary { @apply bg-[#007aff] text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl hover:scale-[1.03] transition-all disabled:opacity-50; }
        .apple-btn-secondary { @apply bg-white text-slate-700 border border-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all; }
        .apple-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23334155' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1.25rem center; background-size: 1rem; }
      `}</style>
    </Layout>
  );
};

const StatCard = ({ title, value, trend, icon, color }: any) => (
  <div className="glass p-8 rounded-[32px] border border-white/50 relative overflow-hidden group">
    <i className={`fa-solid ${icon} absolute -right-4 -top-4 text-6xl opacity-5 ${color}`}></i>
    <div className="space-y-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
      <div>
        <div className="text-4xl font-extrabold text-[#00305d]">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{trend}</div>
      </div>
    </div>
  </div>
);

export default App;