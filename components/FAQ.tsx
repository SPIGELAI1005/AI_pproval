import React, { useState } from 'react';

const FAQ_QUESTIONS = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What is the Deviation AI:PPROVAL system?',
        a: 'Deviation AI:PPROVAL is a High-Fidelity Enterprise Quality Management System (QMS) designed for Webasto Supplier Deviation Approval (SDA) processes. It automates workflows required for IATF 16949 compliance in automotive manufacturing, managing supplier deviations when vendors cannot meet exact technical specifications.'
      },
      {
        q: 'How do I create a new deviation request?',
        a: 'Click "New Deviation" in the sidebar, then fill out the classification, master data, details, risks, and actions tabs. The AI assistant will help verify your entries and suggest improvements. Once complete, click "Submit" to route for approval.'
      },
      {
        q: 'What information is required to submit a deviation?',
        a: 'You need to provide: Business Unit, Trigger Code, Duration Category, Material Number, Supplier Name, Plant, Specification Requirement, Deviation Details, Risk Assessment (FMEA scoring), and Corrective Actions. The system will guide you through each section.'
      },
      {
        q: 'How does the approval routing work?',
        a: 'The system automatically determines approvers based on your Business Unit, Trigger Code, and Duration Category. Deviations over 9 months require Plant Director approval, while shorter durations may only need Quality Manager sign-off. The routing matrix is configurable in Admin settings.'
      }
    ]
  },
  {
    category: 'AI Features',
    questions: [
      {
        q: 'What does the AI Intelligence Layer do?',
        a: 'The I.A.M.Q (Intelligence Layer) acts as a "Virtual Quality Auditor." It performs structured logic checks, suggests technical FMEA risks, predicts IATF audit readiness scores, generates SAP D2 drafts, and detects similarity conflicts with historical deviations.'
      },
      {
        q: 'How accurate is the AI risk assessment?',
        a: 'The AI uses advanced language models trained on Webasto quality standards and IATF 16949 requirements. It provides confidence scores for each recommendation. However, all AI suggestions should be reviewed by qualified Quality Engineers before submission.'
      },
      {
        q: 'What is Intelligent Redaction?',
        a: 'Intelligent Redaction automatically detects and masks Personally Identifiable Information (PII) like names, emails, phone numbers, and proprietary supplier codes before data is sent to the AI service, ensuring GDPR and corporate compliance.'
      },
      {
        q: 'Can I translate deviations to other languages?',
        a: 'Yes! The Technical Translation feature preserves technical terms while translating entire deviations. Supported languages include English, Deutsch (German), and 日本語 (Japanese). The system maintains a technical glossary to ensure accuracy.'
      },
      {
        q: 'How does conflict detection work?',
        a: 'The system compares your current deviation against historical records using AI-powered similarity matching. If a similar deviation was previously rejected at another plant, you\'ll receive a blocking warning to prevent inconsistent quality decisions globally.'
      }
    ]
  },
  {
    category: 'Risk Assessment',
    questions: [
      {
        q: 'What is RPN and how is it calculated?',
        a: 'RPN (Risk Priority Number) = Severity (S) × Occurrence (O) × Detection (D). Each factor is scored 1-10. RPNs ≥ 125 are considered critical and require immediate attention. The system highlights high-risk scores in red throughout the interface.'
      },
      {
        q: 'What\'s the difference between Supplier Risks and Webasto Risks?',
        a: 'Supplier Risks are non-conformities introduced by the vendor (e.g., dimensional deviations, material substitutions). Webasto Risks are potential impacts on our processes, products, or customers (e.g., assembly issues, warranty claims). Both require separate FMEA assessments.'
      },
      {
        q: 'Can I add multiple risks to a deviation?',
        a: 'Yes, click "+ Add Risk" in either the Supplier Risks or Webasto Risks section. Each risk requires a description and S/O/D scores. The system will calculate the RPN automatically and flag critical risks.'
      },
      {
        q: 'What happens if my RPN exceeds 125?',
        a: 'Critical RPNs (≥125) trigger mandatory escalation. The system requires additional justification, may route to higher management levels, and flags the deviation for expedited review. You\'ll see red warnings throughout the interface.'
      }
    ]
  },
  {
    category: 'Approvals & Workflow',
    questions: [
      {
        q: 'How long does approval typically take?',
        a: 'Average cycle time is 4.2 days. Simple deviations (RPN < 40) may be approved in 1-2 days, while complex cases requiring multiple approvers can take 5-7 days. The system tracks cycle time and identifies bottlenecks.'
      },
      {
        q: 'Can I track the status of my deviation?',
        a: 'Yes, navigate to "Approvals" to see all pending items. Click on any deviation to see its current status, approver comments, and timeline. You\'ll receive notifications when actions are required.'
      },
      {
        q: 'What if my deviation is rejected?',
        a: 'Rejected deviations include detailed feedback from approvers. You can view the rejection reason, update the deviation based on feedback, and resubmit. The system maintains a complete audit trail of all decisions.'
      },
      {
        q: 'Can I export my deviation as a PDF?',
        a: 'Yes! Click "Export PDF/A" in the footer. The system generates an IATF-compliant PDF/A document with embedded metadata, watermarked approval status, and a QR code for physical part labeling.'
      }
    ]
  },
  {
    category: 'Compliance & Reporting',
    questions: [
      {
        q: 'How does the system ensure IATF 16949 compliance?',
        a: 'The system enforces IATF requirements through structured workflows, mandatory risk assessments, approval routing matrices, and comprehensive audit trails. The AI provides compliance scoring and identifies gaps before submission.'
      },
      {
        q: 'Where can I view compliance metrics?',
        a: 'Navigate to "Compliance" to see Audit Readiness Center with Documentation Health, CA Closure rates, and IATF Risk Scores. The Dashboard also shows overall compliance trends and cycle time improvements.'
      },
      {
        q: 'How do I access historical deviations?',
        a: 'Click "Archive" to browse all historical records. You can filter by Business Unit, date range, status, or RPN score. Each record includes complete approval history and can be exported for audit purposes.'
      }
    ]
  }
];

const GLOSSARY_TERMS = [
  { term: 'SDA', definition: 'Supplier Deviation Approval - A temporary allowance when a vendor cannot meet exact technical specifications.' },
  { term: 'RPN', definition: 'Risk Priority Number - Calculated as Severity × Occurrence × Detection (1-10 scale each). RPNs ≥ 125 are critical.' },
  { term: 'FMEA', definition: 'Failure Mode and Effects Analysis - A systematic method for evaluating potential failure modes and their impact.' },
  { term: 'IATF 16949', definition: 'International Automotive Task Force standard for quality management systems in automotive manufacturing.' },
  { term: 'BU', definition: 'Business Unit - Organizational division (e.g., ET-Electronics, RB-Roof Systems, RX-Custom Works, EB-E-Solutions).' },
  { term: 'Trigger Code', definition: 'Categorizes the reason for deviation (e.g., 0010-PRAP/EMPB missing, 0020-Dimensional deviation).' },
  { term: 'Duration Category', definition: 'Timeframe classification (e.g., "3 months & prior to handover") affecting approval routing requirements.' },
  { term: 'CAPA', definition: 'Corrective Action / Preventive Action - Systematic approach to addressing quality issues and preventing recurrence.' },
  { term: '8D', definition: 'Eight Disciplines problem-solving methodology used for root cause analysis and corrective actions.' },
  { term: 'SAP D2', definition: 'SAP Document Management system - The AI can generate draft D2 entries for ERP integration.' },
  { term: 'PII', definition: 'Personally Identifiable Information - Data that can identify individuals, automatically redacted by the system.' },
  { term: 'Product Safety Relevant', definition: 'Flag indicating the deviation affects product safety, requiring additional approvals and documentation.' }
];

const FAQ: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'faq' | 'glossary' | 'contact'>('faq');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', description: '', priority: 'medium' });
  const [submitted, setSubmitted] = useState(false);

  const allQuestions = FAQ_QUESTIONS.flatMap(cat => cat.questions);
  const filteredQuestions = searchTerm 
    ? allQuestions.filter(q => 
        q.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.a.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allQuestions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to backend
    console.log('Bug report submitted:', contactForm);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: '', email: '', subject: '', description: '', priority: 'medium' });
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-slide-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold ui-heading">FAQ & Support</h2>
          <p className="ui-text-secondary font-medium">Find answers, browse the glossary, or report issues</p>
        </div>
        <div className="segmented-control flex gap-1 p-1 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
          {[
            { id: 'faq', label: 'FAQ', icon: 'fa-circle-question' },
            { id: 'glossary', label: 'Glossary', icon: 'fa-book' },
            { id: 'contact', label: 'Report Bug', icon: 'fa-bug' }
          ].map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeSection === sec.id
                  ? 'bg-white dark:bg-slate-700 text-[#007aff] shadow-md'
                  : 'ui-text-secondary hover:ui-text-primary'
              }`}
            >
              <i className={`fa-solid ${sec.icon}`}></i>
              <span className="hidden sm:inline">{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      {activeSection === 'faq' && (
        <div className="space-y-8">
          {/* Search */}
          <div className="glass glass-highlight spotlight rounded-[32px] p-6 hover-lift">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 ui-text-tertiary"></i>
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="apple-input pl-11"
              />
            </div>
          </div>

          {/* Questions by Category */}
          {FAQ_QUESTIONS.map((category, catIdx) => {
            const catQuestions = searchTerm 
              ? category.questions.filter(q => 
                  q.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  q.a.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : category.questions;
            
            if (catQuestions.length === 0) return null;

            return (
              <div key={catIdx} className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
                <h3 className="text-xl font-black ui-heading mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-folder text-[#007aff]"></i>
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {catQuestions.map((item, idx) => {
                    const globalIdx = FAQ_QUESTIONS.slice(0, catIdx).reduce((acc, c) => acc + c.questions.length, 0) + idx;
                    const isExpanded = expandedQ === globalIdx;
                    return (
                      <div
                        key={idx}
                        className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all hover:border-[#007aff]/30"
                      >
                        <button
                          onClick={() => setExpandedQ(isExpanded ? null : globalIdx)}
                          className="w-full flex items-center justify-between p-5 text-left group"
                        >
                          <span className="font-bold text-sm ui-text-primary pr-4 group-hover:text-[#007aff] transition-colors">
                            {item.q}
                          </span>
                          <i className={`fa-solid fa-chevron-down text-[#007aff] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}></i>
                        </button>
                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700 pt-4">
                            <p className="text-sm ui-text-secondary leading-relaxed">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Glossary Section */}
      {activeSection === 'glossary' && (
        <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
          <h3 className="text-xl font-black ui-heading mb-6 flex items-center gap-3">
            <i className="fa-solid fa-book text-[#007aff]"></i>
            Technical Glossary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GLOSSARY_TERMS.map((term, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/30 dark:bg-slate-800/30 hover:border-[#007aff]/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#007aff]/10 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-bookmark text-[#007aff] text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm ui-heading mb-1">{term.term}</h4>
                    <p className="text-xs ui-text-secondary leading-relaxed">{term.definition}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact/Bug Report Section */}
      {activeSection === 'contact' && (
        <div className="glass glass-highlight spotlight rounded-[32px] p-8 hover-lift">
          <h3 className="text-xl font-black ui-heading mb-6 flex items-center gap-3">
            <i className="fa-solid fa-bug text-red-500"></i>
            Report a Bug or Issue
          </h3>
          {submitted ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
              <i className="fa-solid fa-check-circle text-emerald-500 text-3xl mb-3"></i>
              <p className="font-bold ui-heading mb-1">Report Submitted Successfully</p>
              <p className="text-sm ui-text-secondary">We'll review your report and get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Your Name">
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="apple-input"
                    placeholder="John Doe"
                  />
                </FormField>
                <FormField label="Email Address">
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="apple-input"
                    placeholder="john.doe@webasto.com"
                  />
                </FormField>
              </div>
              <FormField label="Subject">
                <input
                  type="text"
                  required
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="apple-input"
                  placeholder="Brief description of the issue"
                />
              </FormField>
              <FormField label="Priority">
                <select
                  value={contactForm.priority}
                  onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                  className="apple-input apple-select"
                >
                  <option value="low">Low - Minor UI issue</option>
                  <option value="medium">Medium - Feature not working as expected</option>
                  <option value="high">High - System error preventing work</option>
                  <option value="critical">Critical - Data loss or security concern</option>
                </select>
              </FormField>
              <FormField label="Description">
                <textarea
                  required
                  rows={6}
                  value={contactForm.description}
                  onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                  className="apple-input resize-none"
                  placeholder="Please provide detailed steps to reproduce the issue, expected behavior, and actual behavior..."
                />
              </FormField>
              <div className="flex justify-end gap-4">
                <button type="button" className="apple-btn-secondary">Cancel</button>
                <button type="submit" className="apple-btn-primary">Submit Report</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black ui-label block">{label}</label>
    {children}
  </div>
);

export default FAQ;
