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
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'Heating FOH', rpn: 120, date: '2024-10-15', bu: BU.ET },
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'Heating FOH', rpn: 135, date: '2024-11-20', bu: BU.ET },
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'Heating FOH', rpn: 145, date: '2024-12-10', bu: BU.ET },
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'Heating EOH', rpn: 80, date: '2024-11-05', bu: BU.ET },
    { supplierId: 'SUP001', supplierName: 'Bosch Components', componentGroup: 'Cooling', rpn: 95, date: '2024-10-20', bu: BU.ET },
    
    // Supplier B - Roof Systems
    { supplierId: 'SUP002', supplierName: 'Continental Automotive', componentGroup: 'Heating EOH', rpn: 95, date: '2024-10-20', bu: BU.RB },
    { supplierId: 'SUP002', supplierName: 'Continental Automotive', componentGroup: 'Heating EOH', rpn: 88, date: '2024-11-25', bu: BU.RB },
    { supplierId: 'SUP002', supplierName: 'Continental Automotive', componentGroup: 'Cooling', rpn: 110, date: '2024-12-05', bu: BU.RB },
    { supplierId: 'SUP002', supplierName: 'Continental Automotive', componentGroup: 'RV', rpn: 105, date: '2024-11-10', bu: BU.RB },
    
    // Supplier C - Custom Works
    { supplierId: 'SUP003', supplierName: 'ZF Friedrichshafen', componentGroup: 'Cooling', rpn: 150, date: '2024-09-30', bu: BU.RX },
    { supplierId: 'SUP003', supplierName: 'ZF Friedrichshafen', componentGroup: 'Cooling', rpn: 142, date: '2024-11-15', bu: BU.RX },
    { supplierId: 'SUP003', supplierName: 'ZF Friedrichshafen', componentGroup: 'RV', rpn: 138, date: '2024-12-20', bu: BU.RX },
    { supplierId: 'SUP003', supplierName: 'ZF Friedrichshafen', componentGroup: 'Marine', rpn: 125, date: '2024-10-25', bu: BU.RX },
    
    // Supplier D - E-Solutions
    { supplierId: 'SUP004', supplierName: 'Valeo', componentGroup: 'RV', rpn: 70, date: '2024-11-10', bu: BU.EB },
    { supplierId: 'SUP004', supplierName: 'Valeo', componentGroup: 'RV', rpn: 65, date: '2024-12-15', bu: BU.EB },
    { supplierId: 'SUP004', supplierName: 'Valeo', componentGroup: 'Marine', rpn: 75, date: '2024-11-20', bu: BU.EB },
    
    // Supplier E - Electronics (High Risk)
    { supplierId: 'SUP005', supplierName: 'Hella GmbH', componentGroup: 'Marine', rpn: 125, date: '2024-10-25', bu: BU.ET },
    { supplierId: 'SUP005', supplierName: 'Hella GmbH', componentGroup: 'Marine', rpn: 140, date: '2024-11-30', bu: BU.ET },
    { supplierId: 'SUP005', supplierName: 'Hella GmbH', componentGroup: 'Heating FOH', rpn: 155, date: '2024-12-25', bu: BU.ET },
  ];

  /**
   * Generates a risk heatmap showing supplier vs. component group risk matrix
   */
  async generateRiskHeatmap(
    timeframe: '3m' | '6m' | '12m' = '12m',
    deviationType: 'Supplier' | 'Customer' = 'Supplier'
  ): Promise<HeatmapData> {
    if (deviationType === 'Customer') {
      return this.generateCustomerHeatmap(timeframe);
    }

    return this.generateSupplierHeatmap(timeframe);
  }

  /**
   * Generates a risk heatmap for supplier deviations
   */
  private async generateSupplierHeatmap(
    timeframe: '3m' | '6m' | '12m' = '12m'
  ): Promise<HeatmapData> {
    // Mock supplier heatmap data
    const suppliers = ['Bosch Components', 'Continental Automotive', 'ZF Friedrichshafen', 'Valeo', 'Hella GmbH', 'Mahle GmbH'];
    const componentGroups = ['Heating FOH', 'Heating EOH', 'Cooling', 'RV', 'Marine'];

    // Predefined RPN matrix for consistent mockup data
    const rpnMatrix: number[][] = [
      // Bosch Components: [Heating FOH, Heating EOH, Cooling, RV, Marine]
      [120, 135, 145, 95, 80],
      // Continental Automotive
      [95, 88, 110, 105, 75],
      // ZF Friedrichshafen
      [150, 142, 138, 125, 115],
      // Valeo
      [70, 65, 85, 90, 75],
      // Hella GmbH
      [125, 140, 155, 130, 145],
      // Mahle GmbH
      [110, 98, 105, 115, 100],
    ];

    // Predefined deviation counts
    const deviationMatrix: number[][] = [
      [3, 4, 3, 2, 1],
      [2, 3, 4, 3, 2],
      [4, 3, 5, 2, 3],
      [1, 2, 2, 3, 1],
      [3, 4, 5, 2, 4],
      [2, 3, 3, 4, 2],
    ];

    // Predefined trends
    const trendMatrix: ('increasing' | 'decreasing' | 'stable')[][] = [
      ['increasing', 'increasing', 'increasing', 'stable', 'decreasing'],
      ['decreasing', 'stable', 'increasing', 'increasing', 'stable'],
      ['increasing', 'decreasing', 'stable', 'increasing', 'stable'],
      ['stable', 'decreasing', 'increasing', 'stable', 'decreasing'],
      ['increasing', 'increasing', 'increasing', 'stable', 'increasing'],
      ['stable', 'decreasing', 'increasing', 'increasing', 'stable'],
    ];

    const matrix: HeatmapCell[][] = [];
    
    for (let i = 0; i < suppliers.length; i++) {
      const row: HeatmapCell[] = [];
      for (let j = 0; j < componentGroups.length; j++) {
        const rpn = rpnMatrix[i][j];
        const deviationCount = deviationMatrix[i][j];
        const trend = trendMatrix[i][j];
        const riskLevel = this.getRiskLevel(rpn);
        
        row.push({
          supplier: suppliers[i],
          componentGroup: componentGroups[j],
          rpn,
          deviationCount,
          trend,
          riskLevel,
        });
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
   * Generates a risk heatmap for customer deviations (German OEMs)
   */
  private async generateCustomerHeatmap(
    timeframe: '3m' | '6m' | '12m' = '12m'
  ): Promise<HeatmapData> {
    // Mock customer heatmap data for German OEMs
    const customers = ['BMW Group', 'Mercedes-Benz', 'Volkswagen AG', 'Audi AG', 'Porsche AG', 'Opel Automobile'];
    const componentGroups = ['Heating FOH', 'Heating EOH', 'Cooling', 'RV', 'Marine'];

    // Predefined RPN matrix for consistent mockup data
    const rpnMatrix: number[][] = [
      // BMW Group: [Heating FOH, Heating EOH, Cooling, RV, Marine]
      [106, 93, 125, 129, 56],
      // Mercedes-Benz
      [92, 115, 99, 134, 65],
      // Volkswagen AG
      [129, 86, 134, 56, 50],
      // Audi AG
      [126, 144, 72, 138, 137],
      // Porsche AG
      [95, 83, 108, 106, 78],
      // Opel Automobile
      [51, 81, 143, 60, 58],
    ];

    // Predefined deviation counts
    const deviationMatrix: number[][] = [
      [3, 5, 3, 1, 5],
      [3, 4, 2, 4, 1],
      [1, 2, 5, 1, 3],
      [2, 1, 3, 1, 2],
      [2, 3, 4, 3, 2],
      [3, 4, 2, 1, 1],
    ];

    // Predefined trends
    const trendMatrix: ('increasing' | 'decreasing' | 'stable')[][] = [
      ['increasing', 'increasing', 'increasing', 'stable', 'increasing'],
      ['increasing', 'increasing', 'increasing', 'stable', 'increasing'],
      ['increasing', 'increasing', 'stable', 'increasing', 'increasing'],
      ['increasing', 'stable', 'increasing', 'increasing', 'increasing'],
      ['increasing', 'increasing', 'increasing', 'increasing', 'stable'],
      ['increasing', 'increasing', 'increasing', 'increasing', 'increasing'],
    ];

    const matrix: HeatmapCell[][] = [];
    
    for (let i = 0; i < customers.length; i++) {
      const row: HeatmapCell[] = [];
      for (let j = 0; j < componentGroups.length; j++) {
        const rpn = rpnMatrix[i][j];
        const deviationCount = deviationMatrix[i][j];
        const trend = trendMatrix[i][j];
        const riskLevel = this.getRiskLevel(rpn);
        
        row.push({
          supplier: customers[i],
          componentGroup: componentGroups[j],
          rpn,
          deviationCount,
          trend,
          riskLevel,
        });
      }
      matrix.push(row);
    }

    return {
      suppliers: customers,
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

  /**
   * Identifies at-risk customers (German OEMs) with deteriorating trends or high RPN
   */
  async identifyAtRiskCustomers(): Promise<RiskTrend[]> {
    // Mock customer data for German car manufacturers/OEMs
    const customerData: RiskTrend[] = [
      {
        supplierId: 'CUST001',
        supplierName: 'BMW Group',
        currentRPN: 155,
        averageRPN: 140,
        trend: 'deteriorating',
        trendPercentage: 18.0,
        riskLevel: 'critical',
        recommendation: 'Immediate customer review required. Schedule quality meeting with BMW quality team.',
      },
      {
        supplierId: 'CUST002',
        supplierName: 'Mercedes-Benz',
        currentRPN: 138,
        averageRPN: 143,
        trend: 'stable',
        trendPercentage: -6.7,
        riskLevel: 'critical',
        recommendation: 'Monitor closely. Maintain current quality standards with Mercedes-Benz.',
      },
      {
        supplierId: 'CUST003',
        supplierName: 'Volkswagen AG',
        currentRPN: 110,
        averageRPN: 98,
        trend: 'stable',
        trendPercentage: 4.2,
        riskLevel: 'high',
        recommendation: 'Monitor closely. Maintain current quality standards with VW Group.',
      },
      {
        supplierId: 'CUST004',
        supplierName: 'Audi AG',
        currentRPN: 80,
        averageRPN: 120,
        trend: 'deteriorating',
        trendPercentage: 40.0,
        riskLevel: 'high',
        recommendation: 'Schedule customer review meeting with Audi. Implement corrective actions.',
      },
      {
        supplierId: 'CUST005',
        supplierName: 'Porsche AG',
        currentRPN: 95,
        averageRPN: 85,
        trend: 'improving',
        trendPercentage: -8.5,
        riskLevel: 'high',
        recommendation: 'Positive trend observed. Continue monitoring Porsche requirements.',
      },
      {
        supplierId: 'CUST006',
        supplierName: 'Opel Automobile GmbH',
        currentRPN: 125,
        averageRPN: 115,
        trend: 'deteriorating',
        trendPercentage: 12.5,
        riskLevel: 'critical',
        recommendation: 'Immediate customer review required. Coordinate with Opel quality management.',
      },
    ];

    // Filter to only return at-risk customers (deteriorating or high/critical risk)
    return customerData
      .filter(c => c.trend === 'deteriorating' || c.riskLevel === 'high' || c.riskLevel === 'critical')
      .sort((a, b) => b.currentRPN - a.currentRPN);
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
