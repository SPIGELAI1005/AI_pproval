import { BU } from '../types';

export interface HeatmapData {
  suppliers: string[];
  componentGroups: string[];
  matrix: HeatmapCell[][];
  timeframe: '3m' | '6m' | '12m';
  generatedAt: string;
}

export interface HeatmapCell {
  supplier: string;
  componentGroup: string;
  rpn: number;
  deviationCount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskTrend {
  supplierId: string;
  supplierName: string;
  currentRPN: number;
  averageRPN: number;
  trend: 'improving' | 'deteriorating' | 'stable';
  trendPercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface SupplierRiskProfile {
  supplierId: string;
  supplierName: string;
  totalDeviations: number;
  averageRPN: number;
  criticalDeviations: number;
  trend: RiskTrend['trend'];
  lastDeviationDate: string;
}

/**
 * AnalyticsService provides advanced analytics including risk heatmaps,
 * trend analysis, and predictive risk indicators.
 */
export class AnalyticsService {
  // Mock historical data - in production, this would come from a database
  private mockHistoricalData: {
    supplierId: string;
    supplierName: string;
    componentGroup: string;
    rpn: number;
    date: string;
    bu: BU;
  }[] = [
    // Supplier A - Electronics
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'ECU Modules', rpn: 120, date: '2024-10-15', bu: BU.ET },
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'ECU Modules', rpn: 135, date: '2024-11-20', bu: BU.ET },
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'ECU Modules', rpn: 145, date: '2024-12-10', bu: BU.ET },
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'Sensors', rpn: 80, date: '2024-11-05', bu: BU.ET },
    
    // Supplier B - Roof Systems
    { supplierId: 'SUP002', supplierName: 'Continental Automotive', componentGroup: 'Sunroof Motors', rpn: 95, date: '2024-10-20', bu: BU.RB },
    { supplierId: 'SUP002', supplierName: 'Continental Automotive', componentGroup: 'Sunroof Motors', rpn: 88, date: '2024-11-25', bu: BU.RB },
    { supplierId: 'SUP002', supplierName: 'Continental Automotive', componentGroup: 'Sealing Systems', rpn: 110, date: '2024-12-05', bu: BU.RB },
    
    // Supplier C - Custom Works
    { supplierId: 'SUP003', supplierName: 'ZF Friedrichshafen', componentGroup: 'Actuators', rpn: 150, date: '2024-09-30', bu: BU.RX },
    { supplierId: 'SUP003', supplierName: 'ZF Friedrichshafen', componentGroup: 'Actuators', rpn: 142, date: '2024-11-15', bu: BU.RX },
    { supplierId: 'SUP003', supplierName: 'ZF Friedrichshafen', componentGroup: 'Actuators', rpn: 138, date: '2024-12-20', bu: BU.RX },
    
    // Supplier D - E-Solutions
    { supplierId: 'SUP004', supplierName: 'Valeo', componentGroup: 'Battery Management', rpn: 70, date: '2024-11-10', bu: BU.EB },
    { supplierId: 'SUP004', supplierName: 'Valeo', componentGroup: 'Battery Management', rpn: 65, date: '2024-12-15', bu: BU.EB },
    
    // Supplier E - Electronics (High Risk)
    { supplierId: 'SUP005', supplierName: 'Hella GmbH', componentGroup: 'LED Modules', rpn: 125, date: '2024-10-25', bu: BU.ET },
    { supplierId: 'SUP005', supplierName: 'Hella GmbH', componentGroup: 'LED Modules', rpn: 140, date: '2024-11-30', bu: BU.ET },
    { supplierId: 'SUP005', supplierName: 'Hella GmbH', componentGroup: 'LED Modules', rpn: 155, date: '2024-12-25', bu: BU.ET },
  ];

  /**
   * Generates a risk heatmap showing supplier vs. component group risk matrix
   */
  async generateRiskHeatmap(
    timeframe: '3m' | '6m' | '12m' = '12m'
  ): Promise<HeatmapData> {
    const cutoffDate = this.getCutoffDate(timeframe);
    const filteredData = this.mockHistoricalData.filter(d => new Date(d.date) >= cutoffDate);

    // Get unique suppliers and component groups
    const suppliers = Array.from(new Set(filteredData.map(d => d.supplierName))).sort();
    const componentGroups = Array.from(new Set(filteredData.map(d => d.componentGroup))).sort();

    // Build matrix
    const matrix: HeatmapCell[][] = [];
    
    for (const supplier of suppliers) {
      const row: HeatmapCell[] = [];
      for (const componentGroup of componentGroups) {
        const cellData = filteredData.filter(
          d => d.supplierName === supplier && d.componentGroup === componentGroup
        );
        
        if (cellData.length > 0) {
          const rpns = cellData.map(d => d.rpn);
          const avgRPN = rpns.reduce((a, b) => a + b, 0) / rpns.length;
          const maxRPN = Math.max(...rpns);
          
          // Determine trend (simplified - compare first half vs second half)
          const sortedByDate = cellData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const midPoint = Math.floor(sortedByDate.length / 2);
          const firstHalfAvg = sortedByDate.slice(0, midPoint).reduce((sum, d) => sum + d.rpn, 0) / midPoint || avgRPN;
          const secondHalfAvg = sortedByDate.slice(midPoint).reduce((sum, d) => sum + d.rpn, 0) / (sortedByDate.length - midPoint) || avgRPN;
          
          let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
          if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'increasing';
          else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'decreasing';
          
          const riskLevel = this.getRiskLevel(maxRPN);
          
          row.push({
            supplier,
            componentGroup,
            rpn: Math.round(avgRPN),
            deviationCount: cellData.length,
            trend,
            riskLevel,
          });
        } else {
          // Empty cell
          row.push({
            supplier,
            componentGroup,
            rpn: 0,
            deviationCount: 0,
            trend: 'stable',
            riskLevel: 'low',
          });
        }
      }
      matrix.push(row);
    }

    return {
      suppliers,
      componentGroups,
      matrix,
      timeframe,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Identifies risk trends for a specific supplier
   */
  async identifyRiskTrends(
    supplierId: string
  ): Promise<RiskTrend | null> {
    const supplierData = this.mockHistoricalData.filter(d => d.supplierId === supplierId);
    if (supplierData.length === 0) return null;

    const supplierName = supplierData[0].supplierName;
    const rpns = supplierData.map(d => d.rpn);
    const currentRPN = rpns[rpns.length - 1];
    const averageRPN = rpns.reduce((a, b) => a + b, 0) / rpns.length;

    // Calculate trend
    const sortedByDate = supplierData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const midPoint = Math.floor(sortedByDate.length / 2);
    const firstHalfAvg = sortedByDate.slice(0, midPoint).reduce((sum, d) => sum + d.rpn, 0) / midPoint || averageRPN;
    const secondHalfAvg = sortedByDate.slice(midPoint).reduce((sum, d) => sum + d.rpn, 0) / (sortedByDate.length - midPoint) || averageRPN;
    
    const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    let trend: 'improving' | 'deteriorating' | 'stable' = 'stable';
    if (trendPercentage > 10) trend = 'deteriorating';
    else if (trendPercentage < -10) trend = 'improving';

    const riskLevel = this.getRiskLevel(currentRPN);
    
    let recommendation = '';
    if (trend === 'deteriorating' && riskLevel === 'critical') {
      recommendation = 'Immediate supplier audit required. Consider alternative suppliers.';
    } else if (trend === 'deteriorating' && riskLevel === 'high') {
      recommendation = 'Schedule supplier review meeting. Implement corrective actions.';
    } else if (trend === 'improving') {
      recommendation = 'Positive trend observed. Continue monitoring.';
    } else {
      recommendation = 'Monitor closely. Maintain current quality standards.';
    }

    return {
      supplierId,
      supplierName,
      currentRPN,
      averageRPN: Math.round(averageRPN),
      trend,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
      riskLevel,
      recommendation,
    };
  }

  /**
   * Gets supplier risk profiles for all suppliers
   */
  async getSupplierRiskProfiles(): Promise<SupplierRiskProfile[]> {
    const supplierMap = new Map<string, SupplierRiskProfile>();

    for (const data of this.mockHistoricalData) {
      if (!supplierMap.has(data.supplierId)) {
        supplierMap.set(data.supplierId, {
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          totalDeviations: 0,
          averageRPN: 0,
          criticalDeviations: 0,
          trend: 'stable',
          lastDeviationDate: data.date,
        });
      }

      const profile = supplierMap.get(data.supplierId)!;
      profile.totalDeviations++;
      if (data.rpn >= 125) profile.criticalDeviations++;
    }

    // Calculate averages and trends
    const profiles: SupplierRiskProfile[] = [];
    for (const [supplierId, profile] of supplierMap) {
      const supplierData = this.mockHistoricalData.filter(d => d.supplierId === supplierId);
      const rpns = supplierData.map(d => d.rpn);
      profile.averageRPN = Math.round(rpns.reduce((a, b) => a + b, 0) / rpns.length);
      
      // Determine trend
      const trend = await this.identifyRiskTrends(supplierId);
      if (trend) profile.trend = trend.trend;
      
      profiles.push(profile);
    }

    return profiles.sort((a, b) => b.averageRPN - a.averageRPN);
  }

  /**
   * Identifies at-risk suppliers (deteriorating trend or high RPN)
   */
  async identifyAtRiskSuppliers(): Promise<RiskTrend[]> {
    const profiles = await this.getSupplierRiskProfiles();
    const atRisk: RiskTrend[] = [];

    for (const profile of profiles) {
      const trend = await this.identifyRiskTrends(profile.supplierId);
      if (trend && (trend.trend === 'deteriorating' || trend.riskLevel === 'high' || trend.riskLevel === 'critical')) {
        atRisk.push(trend);
      }
    }

    return atRisk.sort((a, b) => b.currentRPN - a.currentRPN);
  }

  private getCutoffDate(timeframe: '3m' | '6m' | '12m'): Date {
    const now = new Date();
    const months = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12;
    return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  }

  private getRiskLevel(rpn: number): 'low' | 'medium' | 'high' | 'critical' {
    if (rpn >= 125) return 'critical';
    if (rpn >= 80) return 'high';
    if (rpn >= 50) return 'medium';
    return 'low';
  }
}
