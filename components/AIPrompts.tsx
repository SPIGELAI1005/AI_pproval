import React, { useState } from 'react';

interface AIPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  type: 'chat' | 'voice';
}

const CHAT_PROMPTS = [
  // Understanding (5 prompts)
  'What is a Supplier Deviation Approval (SDA)?',
  'How does the FMEA risk scoring work?',
  'What does RPN mean and how is it calculated?',
  'Explain the approval workflow process',
  'What is IATF 16949 compliance?',
  // Glossary (5 prompts)
  'What is a Business Unit (BU)?',
  'What are Trigger Codes?',
  'What is Duration Category?',
  'Explain Product Safety Relevance',
  'What is an ASQE?',
  // Activities (8 prompts)
  'Analyze this deviation for compliance risks',
  'Suggest FMEA risks for this material',
  'Check for similar historical deviations',
  'Generate an 8D report from this deviation',
  'Translate this deviation to Deutsch',
  'Export this deviation as PDF/A',
  'What are the approval bottlenecks?',
  'Suggest corrective actions for this deviation',
];

const VOICE_PROMPTS = [
  // Quick Actions (5 prompts)
  'Set RPN to 150',
  'Mark as critical',
  'Product safety relevant',
  'Set status to draft',
  'Set status to submitted',
  // Data Entry (5 prompts)
  'Material number is EB-772-L',
  'Supplier name is Bosch Components',
  'Description: dimensional deviation on mounting bracket',
  'Severity is 8, occurrence is 5, detection is 3',
  'Due date is next Friday',
  // Risk Management (5 prompts)
  'Add supplier risk: potential dimensional mismatch',
  'Add Webasto risk: assembly line impact',
  'Set severity to 10',
  'Set occurrence to 7',
  'Set detection to 2',
  // Actions (4 prompts)
  'Add immediate action: contact supplier',
  'Add corrective action: implement inspection',
  'Action owner is John Smith',
  'Action due date is January 31st',
];

export default function AIPrompts({ onSelectPrompt, type, chatInputRef, onPromptSelect }: AIPromptsProps) {
  const [showAll, setShowAll] = useState(false);
  
  const allPrompts = type === 'chat' ? CHAT_PROMPTS : VOICE_PROMPTS;
  const displayedPrompts = showAll ? allPrompts : allPrompts.slice(0, 10);
  const remainingCount = allPrompts.length - 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-extrabold ui-heading">
          {type === 'chat' ? 'Suggested Prompts' : 'Voice Commands'}
        </h4>
        {!showAll && remainingCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
          >
            Show {remainingCount} more <i className="fa-solid fa-chevron-down text-[8px]"></i>
          </button>
        )}
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
          >
            Show less <i className="fa-solid fa-chevron-up text-[8px]"></i>
          </button>
        )}
      </div>

      {/* Prompts Grid */}
      <div className="flex flex-wrap gap-2">
        {displayedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelectPrompt(prompt);
              if (onPromptSelect) {
                onPromptSelect(prompt);
              }
              // If chat input ref provided, set the value and focus
              if (chatInputRef?.current) {
                chatInputRef.current.value = prompt;
                chatInputRef.current.focus();
                // Trigger input event to update state
                const event = new Event('input', { bubbles: true });
                chatInputRef.current.dispatchEvent(event);
              }
            }}
            className="px-3 py-2 text-xs font-medium ui-text-secondary bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 rounded-xl border border-white/20 dark:border-white/10 transition-all hover:scale-105 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 text-left"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
