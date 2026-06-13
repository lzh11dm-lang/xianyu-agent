/**
 * 数据分析服务
 * 
 * 功能：
 * 1. 计算关键指标（点击率、咨询成本、预算消耗率等）
 * 2. 对比历史数据，判断趋势
 * 3. 生成复盘报告
 * 4. 提供调整建议
 */

export interface CampaignMetrics {
  // 原始数据
  impressions: number;      // 曝光数
  views: number;             // 浏览数
  clicks: number;            // 点击数
  consults: number;           // 咨询数
  cost: number;              // 消耗金额
  dailyBudget: number;        // 日预算
  
  // 计算指标
  clickRate: number;          // 点击率 = 点击/浏览
  viewRate: number;          // 浏览率 = 浏览/曝光
  consultRate: number;       // 咨询率 = 咨询/点击
  consultCost: number;       // 单次咨询成本 = 消耗/咨询
  budgetUsedRate: number;     // 预算消耗率 = 消耗/预算
  cpm: number;                // 千次曝光成本 = 消耗/曝光*1000
  cpc: number;                // 单次点击成本 = 消耗/点击
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: number;        // 变化百分比
  description: string;
}

export interface DailyReport {
  date: string;
  accountId: string;
  campaignId: string;
  campaignType: '曝光' | '咨询';
  metrics: CampaignMetrics;
  trends: {
    impressions?: TrendData;
    clicks?: TrendData;
    consults?: TrendData;
    cost?: TrendData;
    clickRate?: TrendData;
    consultCost?: TrendData;
  };
  status: '优秀' | '良好' | '一般' | '需优化' | '严重问题';
  suggestions: string[];
  adjustments: {
    action: string;
    reason: string;
    expectedEffect: string;
  }[];
  nextAction?: string;
}

export interface AnalyticsResult {
  metrics: CampaignMetrics;
  trends: Record<string, TrendData>;
  status: '优秀' | '良好' | '一般' | '需优化' | '严重问题';
  suggestions: string[];
  nextAction?: string;
}

/**
 * 计算关键指标
 */
export function calculateMetrics(data: {
  impressions: number;
  views: number;
  clicks: number;
  consults: number;
  cost: number;
  dailyBudget: number;
}): CampaignMetrics {
  const { impressions, views, clicks, consults, cost, dailyBudget } = data;
  
  // 计算各项指标
  const clickRate = views > 0 ? clicks / views : 0;           // 点击率
  const viewRate = impressions > 0 ? views / impressions : 0;  // 浏览率
  const consultRate = clicks > 0 ? consults / clicks : 0;     // 咨询率
  const consultCost = consults > 0 ? cost / consults : Infinity; // 单次咨询成本
  const budgetUsedRate = dailyBudget > 0 ? cost / dailyBudget : 0; // 预算消耗率
  const cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;   // 千次曝光成本
  const cpc = clicks > 0 ? cost / clicks : Infinity;           // 单次点击成本

  return {
    impressions,
    views,
    clicks,
    consults,
    cost,
    dailyBudget,
    clickRate,
    viewRate,
    consultRate,
    consultCost,
    budgetUsedRate,
    cpm,
    cpc,
  };
}

/**
 * 计算趋势
 */
export function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'stable',
      percentage: 0,
      description: current > 0 ? '从无到有' : '无数据',
    };
  }

  const change = (current - previous) / previous;
  const percentage = change * 100;

  let direction: 'up' | 'down' | 'stable';
  if (Math.abs(percentage) < 5) {
    direction = 'stable';
  } else {
    direction = percentage > 0 ? 'up' : 'down';
  }

  const description = `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;

  return {
    direction,
    percentage,
    description,
  };
}

/**
 * 判断计划状态
 */
export function evaluateStatus(
  metrics: CampaignMetrics,
  campaignType: '曝光' | '咨询'
): AnalyticsResult['status'] {
  const { clickRate, budgetUsedRate, consultCost, consults } = metrics;

  // 曝光计划判断标准
  if (campaignType === '曝光') {
    if (clickRate >= 0.15 && budgetUsedRate >= 0.8) {
      return '优秀';
    }
    if (clickRate >= 0.10 && budgetUsedRate >= 0.5) {
      return '良好';
    }
    if (clickRate >= 0.05 && budgetUsedRate >= 0.3) {
      return '一般';
    }
    if (budgetUsedRate < 0.3) {
      return '严重问题';
    }
    return '需优化';
  }

  // 咨询计划判断标准
  if (campaignType === '咨询') {
    if (consultCost <= 30 && budgetUsedRate >= 0.7 && consults >= 5) {
      return '优秀';
    }
    if (consultCost <= 50 && budgetUsedRate >= 0.5) {
      return '良好';
    }
    if (consultCost <= 80 && budgetUsedRate >= 0.3) {
      return '一般';
    }
    if (budgetUsedRate < 0.3 || consultCost > 100) {
      return '严重问题';
    }
    return '需优化';
  }

  return '一般';
}

/**
 * 生成优化建议
 */
export function generateSuggestions(
  metrics: CampaignMetrics,
  campaignType: '曝光' | '咨询',
  status: AnalyticsResult['status']
): string[] {
  const suggestions: string[] = [];
  const { clickRate, budgetUsedRate, consultCost, consults, views, impressions } = metrics;

  // 根据状态生成建议
  switch (status) {
    case '优秀':
      suggestions.push('当前表现优秀，保持当前设置');
      suggestions.push('可以适当小幅度增加预算测试上限');
      break;

    case '良好':
      if (campaignType === '咨询' && consultCost > 30) {
        suggestions.push('咨询成本有优化空间，可尝试微调出价');
      }
      if (budgetUsedRate < 0.6) {
        suggestions.push('预算消耗偏低，可观察是否能消耗更多');
      }
      break;

    case '一般':
      if (clickRate < 0.08) {
        suggestions.push('点击率偏低，建议优化主图和标题');
      }
      if (budgetUsedRate < 0.5) {
        suggestions.push('预算消耗不足，考虑提高出价');
      }
      if (campaignType === '咨询' && consultCost > 50) {
        suggestions.push('咨询成本偏高，注意控制');
      }
      break;

    case '需优化':
      if (clickRate < 0.05) {
        suggestions.push('⚠️ 点击率过低，必须优化主图/标题');
      }
      if (budgetUsedRate < 0.4) {
        suggestions.push('⚠️ 消耗不出去，考虑提价或养曝光');
      }
      if (campaignType === '咨询') {
        suggestions.push('⚠️ 建议按照 SOP 执行调整动作');
      }
      break;

    case '严重问题':
      suggestions.push('🚨 当前计划问题严重，建议立即调整');
      if (budgetUsedRate < 0.3) {
        suggestions.push('消耗率过低（<' + (budgetUsedRate * 100).toFixed(0) + '%），需要提成本或养曝光');
      }
      if (clickRate < 0.03) {
        suggestions.push('点击率严重过低，建议更换素材');
      }
      if (campaignType === '咨询' && consultCost > 100) {
        suggestions.push('咨询成本过高，考虑暂停或大幅调整');
      }
      break;
  }

  return suggestions;
}

/**
 * 获取下一步行动建议
 */
export function getNextAction(
  metrics: CampaignMetrics,
  campaignType: '曝光' | '咨询',
  status: AnalyticsResult['status']
): string | undefined {
  if (status === '优秀' || status === '良好') {
    return undefined; // 无需特殊操作
  }

  if (status === '严重问题' || status === '需优化') {
    if (campaignType === '咨询') {
      if (metrics.budgetUsedRate < 0.3) {
        return '提成本：建议提高出价 20%';
      }
      return '养曝光：停咨询，开曝光计划（日预算 15 元）';
    }
    return '优化素材：更换主图或标题';
  }

  return '继续观察';
}

/**
 * 完整数据分析
 */
export function analyzeCampaign(
  currentData: {
    impressions: number;
    views: number;
    clicks: number;
    consults: number;
    cost: number;
    dailyBudget: number;
  },
  previousData?: {
    impressions: number;
    views: number;
    clicks: number;
    consults: number;
    cost: number;
  },
  campaignType: '曝光' | '咨询' = '咨询'
): AnalyticsResult {
  // 计算当前指标
  const metrics = calculateMetrics(currentData);

  // 计算趋势
  const trends: Record<string, TrendData> = {};
  if (previousData) {
    trends.impressions = calculateTrend(currentData.impressions, previousData.impressions);
    trends.views = calculateTrend(currentData.views, previousData.views);
    trends.clicks = calculateTrend(currentData.clicks, previousData.clicks);
    trends.consults = calculateTrend(currentData.consults, previousData.consults);
    trends.cost = calculateTrend(currentData.cost, previousData.cost);
    trends.clickRate = calculateTrend(metrics.clickRate, previousData.clicks / previousData.views);
    trends.consultCost = calculateTrend(
      metrics.consultCost,
      previousData.consults > 0 ? previousData.cost / previousData.consults : 0
    );
  }

  // 评估状态
  const status = evaluateStatus(metrics, campaignType);

  // 生成建议
  const suggestions = generateSuggestions(metrics, campaignType, status);

  // 获取下一步行动
  const nextAction = getNextAction(metrics, campaignType, status);

  return {
    metrics,
    trends,
    status,
    suggestions,
    nextAction,
  };
}

/**
 * 生成每日复盘报告
 */
export function generateDailyReport(
  accountId: string,
  campaignId: string,
  currentData: {
    impressions: number;
    views: number;
    clicks: number;
    consults: number;
    cost: number;
    dailyBudget: number;
  },
  previousData?: {
    impressions: number;
    views: number;
    clicks: number;
    consults: number;
    cost: number;
  },
  campaignType: '曝光' | '咨询' = '咨询'
): DailyReport {
  const date = new Date().toISOString().split('T')[0];
  const analysis = analyzeCampaign(currentData, previousData, campaignType);

  // 生成调整建议
  const adjustments: DailyReport['adjustments'] = [];
  if (analysis.nextAction) {
    if (analysis.nextAction.includes('提成本')) {
      adjustments.push({
        action: '提成本',
        reason: '消耗率过低，需要提高出价',
        expectedEffect: '提高预算消耗，增加曝光机会',
      });
    } else if (analysis.nextAction.includes('养曝光')) {
      adjustments.push({
        action: '养曝光',
        reason: '持续消耗不出去，需要养曝光',
        expectedEffect: '恢复曝光活力，为后续咨询计划打好基础',
      });
    } else if (analysis.nextAction.includes('优化素材')) {
      adjustments.push({
        action: '优化素材',
        reason: '点击率/浏览率低',
        expectedEffect: '提升素材吸引力，提高点击率',
      });
    }
  }

  return {
    date,
    accountId,
    campaignId,
    campaignType,
    metrics: analysis.metrics,
    trends: analysis.trends as DailyReport['trends'],
    status: analysis.status,
    suggestions: analysis.suggestions,
    adjustments,
    nextAction: analysis.nextAction,
  };
}

/**
 * 格式化指标显示
 */
export function formatMetrics(metrics: CampaignMetrics): Record<string, string> {
  return {
    '曝光数': metrics.impressions.toLocaleString(),
    '浏览数': metrics.views.toLocaleString(),
    '点击数': metrics.clicks.toLocaleString(),
    '咨询数': metrics.consults.toLocaleString(),
    '消耗金额': `¥${metrics.cost.toFixed(2)}`,
    '日预算': `¥${metrics.dailyBudget.toFixed(2)}`,
    '点击率': `${(metrics.clickRate * 100).toFixed(2)}%`,
    '浏览率': `${(metrics.viewRate * 100).toFixed(2)}%`,
    '咨询率': `${(metrics.consultRate * 100).toFixed(2)}%`,
    '单次咨询成本': metrics.consultCost === Infinity ? '-' : `¥${metrics.consultCost.toFixed(2)}`,
    '预算消耗率': `${(metrics.budgetUsedRate * 100).toFixed(1)}%`,
    '千次曝光成本': `¥${metrics.cpm.toFixed(2)}`,
    '单次点击成本': metrics.cpc === Infinity ? '-' : `¥${metrics.cpc.toFixed(2)}`,
  };
}

/**
 * 生成复盘报告文本
 */
export function formatDailyReport(report: DailyReport): string {
  const metrics = report.metrics;
  const trendLines: string[] = [];
  
  if (report.trends.impressions) {
    trendLines.push(`曝光 ${report.trends.impressions.description}`);
  }
  if (report.trends.consults) {
    trendLines.push(`咨询 ${report.trends.consults.description}`);
  }
  if (report.trends.cost) {
    trendLines.push(`消耗 ${report.trends.cost.description}`);
  }

  let reportText = `📊 每日复盘报告 - ${report.date}\n`;
  reportText += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  reportText += `📱 账号: ${report.accountId}\n`;
  reportText += `📋 计划类型: ${report.campaignType}\n`;
  reportText += `🏷️ 状态: ${report.status}\n\n`;
  
  reportText += `📈 核心数据:\n`;
  reportText += `• 曝光: ${metrics.impressions.toLocaleString()}\n`;
  reportText += `• 浏览: ${metrics.views.toLocaleString()}\n`;
  reportText += `• 点击: ${metrics.clicks.toLocaleString()}\n`;
  reportText += `• 咨询: ${metrics.consults}\n`;
  reportText += `• 消耗: ¥${metrics.cost.toFixed(2)} / ¥${metrics.dailyBudget.toFixed(2)}\n\n`;
  
  reportText += `📐 关键指标:\n`;
  reportText += `• 点击率: ${(metrics.clickRate * 100).toFixed(2)}%\n`;
  reportText += `• 预算消耗率: ${(metrics.budgetUsedRate * 100).toFixed(1)}%\n`;
  reportText += `• 单次咨询成本: ${metrics.consultCost === Infinity ? '-' : '¥' + metrics.consultCost.toFixed(2)}\n\n`;
  
  if (trendLines.length > 0) {
    reportText += `📊 趋势变化:\n`;
    trendLines.forEach(line => {
      reportText += `• ${line}\n`;
    });
    reportText += `\n`;
  }
  
  if (report.suggestions.length > 0) {
    reportText += `💡 优化建议:\n`;
    report.suggestions.forEach((suggestion, index) => {
      reportText += `${index + 1}. ${suggestion}\n`;
    });
    reportText += `\n`;
  }
  
  if (report.adjustments.length > 0) {
    reportText += `⚡ 建议操作:\n`;
    report.adjustments.forEach(adj => {
      reportText += `• ${adj.action}: ${adj.reason}\n`;
    });
    reportText += `\n`;
  }
  
  if (report.nextAction) {
    reportText += `🎯 下一步: ${report.nextAction}\n`;
  }

  return reportText;
}
