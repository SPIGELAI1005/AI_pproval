import { DeviationRecord, ApprovalStep, BU, Duration } from '../types';

export interface ApprovalPrediction {
  expectedCompletionDate: string; // ISO date string
  confidence: number; // 0-100
  estimatedDays: number;
  bottlenecks: BottleneckAnalysis[];
  stepPredictions: StepPrediction[];
}

export interface StepPrediction {
  stepId: string;
  role: string;
  expectedDays: number;
  expectedDate: string; // ISO date string
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  historicalAvgDays?: number;
}

export interface BottleneckAnalysis {
  stepId: string;
  role: string;
  issue: 'slow_approver' | 'high_workload' | 'vacation' | 'unknown';
  severity: 'warning' | 'critical';
  currentAvgDays: number;
  historicalAvgDays: number;
  suggestedDelegates?: string[];
  message: string;
}

/**
 * PredictionService analyzes historical approval data to predict
 * expected approval timelines and identify bottlenecks.
 */
export class PredictionService {
  // Mock historical data - in production, this would come from a database
  private historicalData: {
    [key: string]: {
      avgDays: number;
      count: number;
      lastUpdated: string;
    };
  } = {
    'Requestor': { avgDays: 0.5, count: 150, lastUpdated: '2025-01-20' },
    'Project Manager': { avgDays: 1.2, count: 145, lastUpdated: '2025-01-20' },
    'R&D responsible': { avgDays: 2.5, count: 120, lastUpdated: '2025-01-19' },
    'R&D Director / Business Line': { avgDays: 4.8, count: 80, lastUpdated: '2025-01-18' },
    'ME series': { avgDays: 1.8, count: 110, lastUpdated: '2025-01-20' },
    'Head of ME': { avgDays: 3.2, count: 75, lastUpdated: '2025-01-17' },
    'ASQE (Buy Part)': { avgDays: 2.1, count: 130, lastUpdated: '2025-01-20' },
    'Quality Engineer (series)': { avgDays: 1.5, count: 125, lastUpdated: '2025-01-20' },
    'BU Quality Lead': { avgDays: 3.5, count: 70, lastUpdated: '2025-01-16' },
    'Plant Director': { avgDays: 6.2, count: 45, lastUpdated: '2025-01-15' }, // Known bottleneck
    'Product Safety Officer': { avgDays: 2.8, count: 60, lastUpdated: '2025-01-19' },
  };

  // Mock workload data - in production, this would come from an API
  private currentWorkloads: { [role: string]: number } = {
    'Plant Director': 12, // High workload
    'R&D Director / Business Line': 8,
    'BU Quality Lead': 6,
    'Head of ME': 5,
    'Product Safety Officer': 4,
    'R&D responsible': 3,
    'ASQE (Buy Part)': 2,
    'Quality Engineer (series)': 2,
    'ME series': 2,
    'Project Manager': 1,
    'Requestor': 0,
  };

  /**
   * Predicts the approval timeline for a given deviation
   */
  async predictApprovalTimeline(
    deviation: DeviationRecord
  ): Promise<ApprovalPrediction> {
    const startDate = new Date(deviation.masterData.requestDate || new Date().toISOString().split('T')[0]);
    const stepPredictions: StepPrediction[] = [];
    let cumulativeDays = 0;
    const bottlenecks: BottleneckAnalysis[] = [];

    // Analyze each approval step
    for (const step of deviation.approvals) {
      const historical = this.historicalData[step.role] || { avgDays: 3, count: 0, lastUpdated: '' };
      const workload = this.currentWorkloads[step.role] || 0;
      
      // Adjust prediction based on workload and BU
      let expectedDays = historical.avgDays;
      
      // Factor in workload (each pending approval adds 0.3 days)
      expectedDays += workload * 0.3;
      
      // Factor in BU complexity (some BUs are slower)
      if (deviation.classification.bu === BU.RT || deviation.classification.bu === BU.RB) {
        expectedDays *= 1.2; // 20% slower for these BUs
      }
      
      // Factor in duration category (longer durations may take longer to review)
      if ([Duration.D3, Duration.D4, Duration.D5, Duration.D6].includes(deviation.classification.duration)) {
        expectedDays *= 1.15; // 15% slower for longer durations
      }

      // Round to 0.5 day precision
      expectedDays = Math.round(expectedDays * 2) / 2;

      cumulativeDays += expectedDays;
      const expectedDate = new Date(startDate);
      expectedDate.setDate(expectedDate.getDate() + cumulativeDays);

      // Calculate confidence based on historical data count
      const confidence = Math.min(95, 50 + (historical.count / 3));

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (expectedDays > historical.avgDays * 1.5) {
        riskLevel = 'high';
      } else if (expectedDays > historical.avgDays * 1.2) {
        riskLevel = 'medium';
      }

      stepPredictions.push({
        stepId: step.id,
        role: step.role,
        expectedDays,
        expectedDate: expectedDate.toISOString().split('T')[0],
        confidence,
        riskLevel,
        historicalAvgDays: historical.avgDays,
      });

      // Detect bottlenecks
      if (expectedDays > historical.avgDays * 1.3) {
        let issue: BottleneckAnalysis['issue'] = 'slow_approver';
        let severity: 'warning' | 'critical' = 'warning';
        const suggestedDelegates: string[] = [];

        if (workload > 8) {
          issue = 'high_workload';
          severity = 'critical';
          // Suggest delegates based on role
          if (step.role === 'Plant Director') {
            suggestedDelegates.push('Deputy Plant Director', 'Plant Quality Manager');
          } else if (step.role === 'R&D Director / Business Line') {
            suggestedDelegates.push('Senior R&D Manager', 'Technical Lead');
          }
        } else if (expectedDays > historical.avgDays * 2) {
          severity = 'critical';
        }

        bottlenecks.push({
          stepId: step.id,
          role: step.role,
          issue,
          severity,
          currentAvgDays: expectedDays,
          historicalAvgDays: historical.avgDays,
          suggestedDelegates: suggestedDelegates.length > 0 ? suggestedDelegates : undefined,
          message: this.generateBottleneckMessage(step.role, issue, expectedDays, historical.avgDays, workload),
        });
      }
    }

    // Calculate overall confidence (weighted average)
    const overallConfidence = stepPredictions.reduce((sum, sp) => sum + sp.confidence, 0) / stepPredictions.length;

    const finalDate = new Date(startDate);
    finalDate.setDate(finalDate.getDate() + cumulativeDays);

    return {
      expectedCompletionDate: finalDate.toISOString().split('T')[0],
      confidence: Math.round(overallConfidence),
      estimatedDays: Math.round(cumulativeDays * 10) / 10,
      bottlenecks,
      stepPredictions,
    };
  }

  /**
   * Identifies bottlenecks for a specific BU and role
   */
  async identifyBottlenecks(
    bu: BU,
    role: string
  ): Promise<BottleneckAnalysis | null> {
    const historical = this.historicalData[role];
    if (!historical) return null;

    const workload = this.currentWorkloads[role] || 0;
    let expectedDays = historical.avgDays;
    expectedDays += workload * 0.3;

    if (expectedDays > historical.avgDays * 1.3) {
      let issue: BottleneckAnalysis['issue'] = 'slow_approver';
      let severity: 'warning' | 'critical' = 'warning';

      if (workload > 8) {
        issue = 'high_workload';
        severity = 'critical';
      } else if (expectedDays > historical.avgDays * 2) {
        severity = 'critical';
      }

      return {
        stepId: '',
        role,
        issue,
        severity,
        currentAvgDays: expectedDays,
        historicalAvgDays: historical.avgDays,
        message: this.generateBottleneckMessage(role, issue, expectedDays, historical.avgDays, workload),
      };
    }

    return null;
  }

  private generateBottleneckMessage(
    role: string,
    issue: BottleneckAnalysis['issue'],
    currentDays: number,
    historicalDays: number,
    workload: number
  ): string {
    const delay = Math.round((currentDays - historicalDays) * 10) / 10;
    
    if (issue === 'high_workload') {
      return `${role} has ${workload} pending approvals (${delay} days slower than average). Consider delegating to reduce delay.`;
    } else if (issue === 'slow_approver') {
      return `${role} is currently ${delay} days slower than historical average. This may delay approval.`;
    } else {
      return `${role} approval is expected to take ${currentDays} days (${delay} days above average).`;
    }
  }
}
