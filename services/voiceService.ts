import { DeviationRecord } from '../types';
import { AIService } from './aiService';

export interface VoiceTranscription {
  text: string;
  confidence: number;
  language?: string;
}

export interface StructuredFormData {
  materialNo?: string;
  supplierName?: string;
  description?: string;
  specification?: string;
  deviation?: string;
  severity?: number;
  occurrence?: number;
  detection?: number;
  rpn?: number;
  actionDescription?: string;
  actionOwner?: string;
  dueDate?: string;
}

/**
 * VoiceService handles voice input, transcription, and form field mapping
 * Supports multiple AI providers with voice/audio capabilities
 */
export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Request microphone permission and start recording
   */
  async startVoiceInput(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for speech recognition
        } 
      });

      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000,
      };

      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Failed to start voice input:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopVoiceInput(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not currently recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        this.isRecording = false;
        
        // Stop all tracks to release microphone
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Transcribe audio to text using AI service
   */
  async transcribeAudio(audioBlob: Blob): Promise<VoiceTranscription> {
    try {
      // Convert blob to base64 for API
      const base64Audio = await this.blobToBase64(audioBlob);
      
      // Use AI service for transcription
      // Note: This is a simplified implementation
      // In production, you'd use a dedicated speech-to-text API
      const transcription = await this.aiService.transcribeAudio(base64Audio);
      
      return {
        text: transcription.text,
        confidence: transcription.confidence || 0.85,
        language: transcription.language,
      };
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Process voice command and extract structured form data
   */
  async processVoiceCommand(
    transcription: string,
    currentFormState: Partial<DeviationRecord>
  ): Promise<StructuredFormData> {
    try {
      // Use AI to extract structured data from transcription
      const prompt = `Extract structured data from this voice transcription for a supplier deviation form:

Transcription: "${transcription}"

Current form state:
- Material: ${currentFormState.masterData?.materialNo || 'not set'}
- Supplier: ${currentFormState.masterData?.supplierName || 'not set'}
- Description: ${currentFormState.masterData?.description || 'not set'}

Extract and return ONLY a JSON object with these fields (only include fields that were mentioned):
{
  "materialNo": "string or null",
  "supplierName": "string or null",
  "description": "string or null",
  "specification": "string or null",
  "deviation": "string or null",
  "severity": number or null (1-10),
  "occurrence": number or null (1-10),
  "detection": number or null (1-10),
  "rpn": number or null (severity × occurrence × detection),
  "actionDescription": "string or null",
  "actionOwner": "string or null",
  "dueDate": "string or null (YYYY-MM-DD format)"
}

Return ONLY valid JSON, no other text.`;

      // Create a minimal deviation record for analysis
      const mockDeviation = {
        id: 'voice-temp',
        status: 'Draft' as any,
        masterData: {
          materialNo: currentFormState.masterData?.materialNo || '',
          supplierName: currentFormState.masterData?.supplierName || '',
          description: prompt,
        } as any,
        classification: {} as any,
        details: {} as any,
        risks: [],
        actions: [],
        approvals: [],
        timestamp: new Date().toISOString(),
      };

      if (!this.aiService || !this.aiService.available) {
        throw new Error('AI service is not available. Please configure an AI API key to use voice features.');
      }
      const response = await this.aiService.analyzeDeviation(mockDeviation, false);

      // Parse structured data from AI response
      // The AI response contains structured analysis, extract relevant fields
      const structuredData = this.parseStructuredData(JSON.stringify(response) || '');
      
      return structuredData;
    } catch (error) {
      console.error('Voice command processing failed:', error);
      // Fallback: return basic transcription as description
      return {
        description: transcription,
      };
    }
  }

  /**
   * Handle voice command shortcuts
   */
  async processVoiceShortcut(
    transcription: string,
    currentFormState: Partial<DeviationRecord>
  ): Promise<Partial<DeviationRecord> | null> {
    const lowerText = transcription.toLowerCase().trim();

    // RPN commands
    if (lowerText.match(/set rpn to (\d+)/i)) {
      const match = lowerText.match(/set rpn to (\d+)/i);
      const rpn = parseInt(match![1], 10);
      // Calculate suggested S/O/D values
      const suggestedValues = this.calculateSODFromRPN(rpn);
      return {
        risks: currentFormState.risks?.map((r, idx) => 
          idx === 0 ? { ...r, ...suggestedValues, rpn } : r
        ) || [],
      };
    }

    // Mark as critical
    if (lowerText.includes('mark as critical') || lowerText.includes('critical')) {
      return {
        risks: currentFormState.risks?.map((r, idx) => 
          idx === 0 ? { ...r, severity: 10, occurrence: 5, detection: 5, rpn: 250 } : r
        ) || [],
      };
    }

    // Set status
    if (lowerText.includes('set status to draft')) {
      return { status: 'Draft' as any };
    }
    if (lowerText.includes('set status to submitted')) {
      return { status: 'Submitted' as any };
    }

    // Product safety
    if (lowerText.includes('product safety') || lowerText.includes('safety relevant')) {
      return {
        masterData: {
          ...currentFormState.masterData,
          productSafetyRelevant: true,
        } as any,
      };
    }

    return null;
  }

  /**
   * Check if microphone is available
   */
  async checkMicrophoneAvailable(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'audioinput');
    } catch {
      return false;
    }
  }

  /**
   * Get current recording state
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private parseStructuredData(aiResponse: string): StructuredFormData {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch {
      return {};
    }
  }

  private calculateSODFromRPN(targetRPN: number): { severity: number; occurrence: number; detection: number } {
    // Simple heuristic: try to find reasonable S/O/D values
    // For RPN 125, try 5×5×5 = 125
    // For RPN 150, try 6×5×5 = 150
    // For RPN 200, try 8×5×5 = 200
    
    if (targetRPN <= 50) {
      return { severity: 3, occurrence: 3, detection: 5 };
    } else if (targetRPN <= 100) {
      return { severity: 5, occurrence: 4, detection: 5 };
    } else if (targetRPN <= 150) {
      return { severity: 6, occurrence: 5, detection: 5 };
    } else if (targetRPN <= 200) {
      return { severity: 8, occurrence: 5, detection: 5 };
    } else {
      return { severity: 10, occurrence: 5, detection: 5 };
    }
  }
}
