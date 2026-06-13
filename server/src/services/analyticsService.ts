/**
 * 数据分析服务 - 自动分析投流数据并给出调整建议
 */

export interface PlanData {
  planId: string;
  planName: string;
  planType: 'exposure' | 'consult';
  status: 'running' | 'paused' | 'stopped';
  
  // 核心数据
  consume: number;           // 消耗金额
  consult: number;          // 咨询数
  exposure: number;          // 曝光数
  click: number;            // 点击数
  clickRate: number;        // 点击率 (%)
  
  // 计算指标
  costPerConsult: number;   // 单次咨询成本
  ctr: number;              // 点击率
  
  // 时间信息
  startTime: string;
  lastUpdate: string;
}

export interface AnalysisResult {
  isHealthy: boolean;
  issue?: string;
  suggestion?: string;
  action?: 'continue' | 'increase_bid' | 'reduce_bid' | 'pause' | 'refresh_exposure' | 'stop';
}

export interface DailyReport {
  date: string;
  accountId: string;
  totalConsume: number;
  totalConsult: number;
  totalExposure: number;
  totalClick: number;
  avgClickRate: number;
  avgCostPerConsult: number;
  planCount: number;
  healthyPlans: number;
  unhealthyPlans: number;
  recommendations: string[];
}

/**
 * 分析单个计划的数据
 */
export function analyzePlan(data: PlanData): AnalysisResult {
  // 1. 检查是否消耗不出去
  if (data.consume < 1) {
    return {
      isHealthy: false,
      issue: '计划几乎没有消耗',
      suggestion: '建议提高出价或检查计划状态',
      action: 'increase_bid',
    };
  }
  
  // 2. 检查点击率
  if (data.ctr < 1) {
    return {
      isHealthy: false,
      issue: `点击率过低 (${data.ctr.toFixed(2)}%)`,
      suggestion: '建议优化商品主图或标题，提高吸引力',
      action: 'continue',
    };
  }
  
  // 3. 检查咨询成本
  if (data.costPerConsult > 100) {
    return {
      isHealthy: false,
      issue: `咨询成本过高 (¥${data.costPerConsult.toFixed(2)})`,
      suggestion: '建议适当降低出价或优化投放人群',
      action: 'reduce_bid',
    };
  }
  
  // 4. 检查消耗速度（如果有消耗但咨询为0）
  if (data.consume > 50 && data.consult === 0) {
    return {
      isHealthy: false,
      issue: '消耗较高但无咨询转化',
      suggestion: '建议检查商品详情页和定价，或暂停计划优化链接',
      action: 'pause',
    };
  }
  
  // 5. 健康状态
  if (data.costPerConsult <= 50 && data.ctr >= 2) {
    return {
      isHealthy: true,
      issue: undefined,
      suggestion: '计划状态良好，继续保持',
      action: 'continue',
    };
  }
  
  // 6. 一般状态
  return {
    isHealthy: true,
    issue: undefined,
    suggestion: '计划状态一般，可观察',
    action: 'continue',
  };
}

/**
 * 根据 SOP 规则生成调整建议
 */
export function generateAdjustment(data: PlanData, dayInCampaign: number): AnalysisResult {
  const analysis = analyzePlan(data);
  
  // SOP 规则：
  // 1. 消耗不出去 -> 提成本 20%
  // 2. 提成本后还是不行 -> 养曝光（曝光计划，15元日预算，2-3天）
  // 3. 还是不行 -> 上新链接赛马
  
  if (!analysis.isHealthy) {
    // 第一步：提成本
    if (analysis.action === 'increase_bid' || analysis.action === 'continue') {
      return {
        isHealthy: false,
        issue: analysis.issue,
        suggestion: `[SOP Step 1] 建议提高成本出价 20%，然后观察 1 天`,
        action: 'increase_bid',
      };
    }
    
    // 消耗不出去 + 已提过成本 -> 养曝光
    if (data.consume < 10 && dayInCampaign > 1) {
      return {
        isHealthy: false,
        issue: analysis.issue || '消耗不出去',
        suggestion: `[SOP Step 2] 建议切换到曝光计划养曝光（日预算 15 元，2-3 天）`,
        action: 'refresh_exposure',
      };
    }
    
    // 多次调整后仍不行 -> 停止
    if (dayInCampaign > 7) {
      return {
        isHealthy: false,
        issue: analysis.issue || '计划持续表现不佳',
        suggestion: `[SOP Step 3] 建议停止该计划，上新链接继续赛马`,
        action: 'stop',
      };
    }
  }
  
  return analysis;
}

/**
 * 生成每日运营报告
 */
export function generateDailyReport(
  date: string,
  accountId: string,
  plans: PlanData[]
): DailyReport {
  const totalConsume = plans.reduce((sum, p) => sum + p.consume, 0);
  const totalConsult = plans.reduce((sum, p) => sum + p.consult, 0);
  const totalExposure = plans.reduce((sum, p) => sum + p.exposure, 0);
  const totalClick = plans.reduce((sum, p) => sum + p.click, 0);
  
  const avgClickRate = plans.length > 0 
    ? plans.reduce((sum, p) => sum + p.ctr, 0) / plans.length 
    : 0;
  
  const avgCostPerConsult = totalConsult > 0 
    ? totalConsume / totalConsult 
    : 0;
  
  const planAnalysis = plans.map(p => analyzePlan(p));
  const healthyPlans = planAnalysis.filter(a => a.isHealthy).length;
  const unhealthyPlans = planAnalysis.filter(a => !a.isHealthy).length;
  
  const recommendations: string[] = [];
  
  // 生成建议
  planAnalysis.forEach((analysis, index) => {
    if (!analysis.isHealthy && analysis.suggestion) {
      recommendations.push(`${plans[index].planName}: ${analysis.suggestion}`);
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('所有计划状态良好，继续保持当前策略');
  }
  
  return {
    date,
    accountId,
    totalConsume,
    totalConsult,
    totalExposure,
    totalClick,
    avgClickRate,
    avgCostPerConsult,
    planCount: plans.length,
    healthyPlans,
    unhealthyPlans,
    recommendations,
  };
}

/**
 * 格式化报告为文本
 */
export function formatReportText(report: DailyReport): string {
  return `
📊 每日运营报告 - ${report.date}
━━━━━━━━━━━━━━━━━━━━━━

💰 数据概览
• 总消耗: ¥${report.totalConsume.toFixed(2)}
• 总咨询: ${report.totalConsult}
• 总曝光: ${report.totalExposure.toLocaleString()}
• 总点击: ${report.totalClick.toLocaleString()}
• 平均点击率: ${report.avgClickRate.toFixed(2)}%
• 平均咨询成本: ¥${report.avgCostPerConsult.toFixed(2)}

📈 计划状态
• 总计划数: ${report.planCount}
• 健康计划: ${report.healthyPlans}
• 异常计划: ${report.unhealthyPlans}

💡 调整建议
${report.recommendations.map(r => `• ${r}`).join('\n')}
`;
}
