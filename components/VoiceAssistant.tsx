import React, { useState, useEffect, useRef } from 'react';
import { VoiceService, VoiceTranscription, StructuredFormData } from '../services/voiceService';
import { DeviationRecord } from '../types';

interface VoiceAssistantProps {
  deviation: Partial<DeviationRecord>;
  onUpdate: (updates: Partial<DeviationRecord>) => void;
  disabled?: boolean;
}

export default function VoiceAssistant({ deviation, onUpdate, disabled }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [microphoneAvailable, setMicrophoneAvailable] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize voice service
    try {
      voiceServiceRef.current = new VoiceService();
      checkMicrophone();
    } catch (err) {
      console.error('Failed to initialize voice service:', err);
      setError('Voice service unavailable');
    }

    return () => {
      // Cleanup on unmount
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (voiceServiceRef.current?.isCurrentlyRecording()) {
        voiceServiceRef.current.stopVoiceInput().catch(console.error);
      }
    };
  }, []);

  const checkMicrophone = async () => {
    if (voiceServiceRef.current) {
      const available = await voiceServiceRef.current.checkMicrophoneAvailable();
      setMicrophoneAvailable(available);
    }
  };

  const handleStartRecording = async () => {
    if (!voiceServiceRef.current || disabled) return;

    try {
      setError(null);
      setTranscription('');
      await voiceServiceRef.current.startVoiceInput();
      setIsRecording(true);
      setShowPanel(true);

      // Auto-stop after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        handleStopRecording();
      }, 30000);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!voiceServiceRef.current || !isRecording) return;

    try {
      setIsProcessing(true);
      
      // Stop recording
      const audioBlob = await voiceServiceRef.current.stopVoiceInput();
      setIsRecording(false);

      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      // Transcribe audio
      const transcriptionResult: VoiceTranscription = await voiceServiceRef.current.transcribeAudio(audioBlob);
      setTranscription(transcriptionResult.text);

      // Process voice command (check for shortcuts first)
      const shortcutResult = await voiceServiceRef.current.processVoiceShortcut(
        transcriptionResult.text,
        deviation
      );

      if (shortcutResult) {
        // Apply shortcut directly
        onUpdate(shortcutResult);
      } else {
        // Process as structured form data
        const structuredData: StructuredFormData = await voiceServiceRef.current.processVoiceCommand(
          transcriptionResult.text,
          deviation
        );

        // Apply structured data to form
        const updates: Partial<DeviationRecord> = {};
        
        if (structuredData.materialNo) {
          updates.masterData = {
            ...deviation.masterData,
            materialNo: structuredData.materialNo,
          } as any;
        }
        
        if (structuredData.supplierName) {
          updates.masterData = {
            ...updates.masterData || deviation.masterData,
            supplierName: structuredData.supplierName,
          } as any;
        }
        
        if (structuredData.description) {
          updates.masterData = {
            ...updates.masterData || deviation.masterData,
            description: structuredData.description,
          } as any;
        }
        
        if (structuredData.specification) {
          updates.details = {
            ...deviation.details,
            specification: structuredData.specification,
          } as any;
        }
        
        if (structuredData.deviation) {
          updates.details = {
            ...updates.details || deviation.details,
            deviation: structuredData.deviation,
          } as any;
        }
        
        if (structuredData.severity || structuredData.occurrence || structuredData.detection) {
          const existingRisk = deviation.risks?.[0];
          updates.risks = [{
            ...existingRisk,
            id: existingRisk?.id || Math.random().toString(36).substr(2, 9),
            source: existingRisk?.source || 'Supplier',
            description: existingRisk?.description || '',
            severity: structuredData.severity || existingRisk?.severity || 5,
            occurrence: structuredData.occurrence || existingRisk?.occurrence || 5,
            detection: structuredData.detection || existingRisk?.detection || 5,
            rpn: structuredData.rpn || (structuredData.severity || existingRisk?.severity || 5) * 
                                      (structuredData.occurrence || existingRisk?.occurrence || 5) * 
                                      (structuredData.detection || existingRisk?.detection || 5),
          } as any, ...(deviation.risks?.slice(1) || [])];
        }

        if (Object.keys(updates).length > 0) {
          onUpdate(updates);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process voice input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (voiceServiceRef.current?.isCurrentlyRecording()) {
      await voiceServiceRef.current.stopVoiceInput();
    }
    setIsRecording(false);
    setTranscription('');
    setError(null);
    setShowPanel(false);
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  };

  if (!microphoneAvailable && !showPanel) {
    return null; // Don't show if microphone not available
  }

  return (
    <>
      {/* Floating Voice Button */}
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled || isProcessing || !microphoneAvailable}
        className={`fixed bottom-24 right-6 z-50 h-16 w-16 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        } ${disabled || !microphoneAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isProcessing ? (
          <i className="fa-solid fa-circle-notch animate-spin text-white text-xl"></i>
        ) : isRecording ? (
          <i className="fa-solid fa-stop text-white text-xl"></i>
        ) : (
          <i className="fa-solid fa-microphone text-white text-xl"></i>
        )}
      </button>

      {/* Voice Panel */}
      {showPanel && (
        <div className="fixed bottom-32 right-6 z-50 glass rounded-2xl border border-white/50 p-6 shadow-2xl w-96 max-w-[calc(100vw-3rem)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                isRecording ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-white`}></i>
              </div>
              <div>
                <h3 className="text-sm font-extrabold ui-heading">Voice Input</h3>
                <p className="text-[10px] ui-text-secondary">
                  {isRecording ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {isRecording && (
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <span className="text-[10px] font-bold text-red-500">REC</span>
            </div>
          )}

          {transcription && (
            <div className="mb-4">
              <p className="text-xs font-bold ui-label mb-2">Transcription:</p>
              <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/20">
                <p className="text-sm ui-text-primary">{transcription}</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <i className="fa-solid fa-circle-notch animate-spin text-blue-500 text-xl"></i>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-[9px] font-bold ui-text-tertiary mb-2">Voice Commands:</p>
            <div className="space-y-1 text-[9px] ui-text-secondary">
              <p>• "Set RPN to 150"</p>
              <p>• "Mark as critical"</p>
              <p>• "Product safety relevant"</p>
              <p>• Describe deviation naturally</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
