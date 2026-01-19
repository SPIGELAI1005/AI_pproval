import React, { useState } from 'react';
import { AIResponse, DeviationRecord } from '../types';
import AIAssistant from './AIAssistant';
import VoiceAssistant from './VoiceAssistant';
import AIPrompts from './AIPrompts';
import AIChat from './AIChat';

interface GlobalAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  deviation?: Partial<DeviationRecord>;
  aiAnalysis?: AIResponse | null;
  loadingAI?: boolean;
  onAnalyze?: () => void;
  redactionMode?: boolean;
  setRedactionMode?: (val: boolean) => void;
  onDeviationUpdate?: (updates: Partial<DeviationRecord>) => void;
}

export default function GlobalAIPanel({
  isOpen,
  onClose,
  deviation,
  aiAnalysis,
  loadingAI = false,
  onAnalyze,
  redactionMode = false,
  setRedactionMode,
  onDeviationUpdate,
}: GlobalAIPanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');
  const chatInputRef = React.useRef<HTMLTextAreaElement>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  if (!isOpen) return null;

  // Create a minimal deviation if none provided
  const currentDeviation: Partial<DeviationRecord> = deviation || {
    id: 'global-ai',
    status: 'Draft' as any,
    masterData: {} as any,
    classification: {} as any,
    details: {} as any,
    risks: [],
    actions: [],
    approvals: [],
    timestamp: new Date().toISOString(),
  };

  return (
    <>
      {/* Backdrop - minimal blur to keep content visible */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/30 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[700px] z-50 frosted-panel flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/40 dark:border-white/10 bg-gradient-to-tr from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/8 dark:to-transparent shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/40 relative group/icon">
                <i className="fa-solid fa-sparkles text-[10px] absolute top-1.5 right-1.5 opacity-60 group-hover/icon:opacity-100 transition-opacity text-white"></i>
                <i className="fa-solid fa-comment-dots text-lg scale-x-[-1]"></i>
              </div>
              <div>
                <h3 className="text-lg font-extrabold ui-heading tracking-tighter transition-colors">
                  I&nbsp;&nbsp;A:M&nbsp;&nbsp;Q
                </h3>
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest transition-colors">
                  Intelligence Layer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/20 dark:hover:bg-white/10 transition-all"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'chat'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white/20 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-white/15'
              }`}
            >
              <i className="fa-solid fa-comment-dots mr-2"></i>
              AI Chat
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'voice'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white/20 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-white/15'
              }`}
            >
              <i className="fa-solid fa-microphone mr-2"></i>
              Voice
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Chat Interface - Always show when AI Chat tab is active */}
              <>
                {/* Prompts Section */}
                <div className="mb-6 shrink-0">
                  <AIPrompts
                    type="chat"
                    onSelectPrompt={(prompt) => {
                      setSelectedPrompt(prompt);
                    }}
                    chatInputRef={chatInputRef}
                    onPromptSelect={(prompt) => {
                      setSelectedPrompt(prompt);
                    }}
                  />
                </div>

                {/* Chat Messages */}
                <div className="flex-1 min-h-0">
                  <AIChat
                    onSendMessage={async (message) => {
                      // Mock response for now - can be connected to AI service
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      return `I understand you're asking: "${message}". This is a mock response. To enable full AI chat functionality, please configure the AI service with chat capabilities.`;
                    }}
                    deviation={currentDeviation}
                    inputRef={chatInputRef}
                    onPromptSelect={(prompt) => {
                      setSelectedPrompt(prompt);
                    }}
                  />
                </div>
              </>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="h-full flex flex-col">
              {/* Voice Prompts Section */}
              <div className="mb-6 shrink-0">
                <AIPrompts
                  type="voice"
                  onSelectPrompt={(prompt) => {
                    // Handle voice prompt selection
                    if (onDeviationUpdate) {
                      console.log('Selected voice prompt:', prompt);
                      // Process the prompt as a voice command
                      // This would trigger the voice service to process the command
                    }
                  }}
                />
              </div>

              {/* Voice Assistant or Info */}
              <div className="flex-1 min-h-0">
                {onDeviationUpdate ? (
                  <div className="space-y-4">
                    <VoiceAssistant
                      deviation={currentDeviation}
                      onUpdate={onDeviationUpdate}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4">
                      <i className="fa-solid fa-microphone text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-extrabold ui-heading mb-2">Voice Assistant</h3>
                    <p className="text-sm ui-text-secondary mb-6">
                      Use voice commands to interact with the system
                    </p>
                    <p className="text-xs ui-text-tertiary">
                      Navigate to a deviation form to use voice input features.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
