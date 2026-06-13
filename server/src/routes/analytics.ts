/**
 * 复盘报告路由
 * 
 * 提供数据分析和复盘报告接口
 */

import { Router } from 'express';
import {
  analyzeCampaign,
  generateDailyReport,
  calculateMetrics,
  formatDailyReport,
  formatMetrics,
  type AnalyticsResult,
  type DailyReport,
  type CampaignMetrics,
} from '../services/analyticsService';

const router = Router();

/**
 * POST /api/v1/analytics/analyze
 * 分析计划数据
 * Body: {
 *   accountId: string,
 *   campaignId: string,
 *   currentData: { impressions, views, clicks, consults, cost, dailyBudget },
 *   previousData?: { impressions, views, clicks, consults, cost },  // 可选，对比数据
 *   campaignType?: '曝光' | '咨询'
 * }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { accountId, campaignId, currentData, previousData, campaignType = '咨询' } = req.body;

    if (!accountId || !campaignId || !currentData) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    // 执行分析
    const result = analyzeCampaign(currentData, previousData, campaignType);

    res.json({
      success: true,
      data: {
        accountId,
        campaignId,
        campaignType,
        ...result,
        formattedMetrics: formatMetrics(result.metrics),
      },
    });
  } catch (error: any) {
    console.error('分析失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/analytics/daily-report
 * 生成每日复盘报告
 * Body: {
 *   accountId: string,
 *   campaignId: string,
 *   currentData: { impressions, views, clicks, consults, cost, dailyBudget },
 *   previousData?: { impressions, views, clicks, consults, cost },
 *   campaignType?: '曝光' | '咨询'
 * }
 */
router.post('/daily-report', async (req, res) => {
  try {
    const { accountId, campaignId, currentData, previousData, campaignType = '咨询' } = req.body;

    if (!accountId || !campaignId || !currentData) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    // 生成报告
    const report = generateDailyReport(accountId, campaignId, currentData, previousData, campaignType);

    // 格式化报告文本
    const reportText = formatDailyReport(report);

    res.json({
      success: true,
      data: {
        report,
        reportText,
      },
    });
  } catch (error: any) {
    console.error('生成报告失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/analytics/calculate
 * 仅计算指标（不生成建议）
 * Body: { impressions, views, clicks, consults, cost, dailyBudget }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { impressions, views, clicks, consults, cost, dailyBudget } = req.body;

    if (
      impressions === undefined ||
      views === undefined ||
      clicks === undefined ||
      consults === undefined ||
      cost === undefined ||
      dailyBudget === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const metrics = calculateMetrics({
      impressions,
      views,
      clicks,
      consults,
      cost,
      dailyBudget,
    });

    res.json({
      success: true,
      data: {
        metrics,
        formatted: formatMetrics(metrics),
      },
    });
  } catch (error: any) {
    console.error('计算失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/analytics/guide
 * 获取数据分析指引
 */
router.get('/guide', (req, res) => {
  const guide = {
    title: '数据分析与复盘指引',
    sections: [
      {
        title: '核心指标说明',
        items: [
          { name: '点击率', formula: '点击数 / 浏览数', good: '≥10%', bad: '<5%' },
          { name: '预算消耗率', formula: '消耗金额 / 日预算', good: '≥70%', bad: '<30%' },
          { name: '单次咨询成本', formula: '消耗金额 / 咨询数', good: '≤30元', bad: '>80元' },
          { name: '咨询率', formula: '咨询数 / 点击数', good: '≥20%', bad: '<10%' },
        ],
      },
      {
        title: '状态判断标准',
        items: [
          { status: '优秀', conditions: '点击率≥15% 且 消耗率≥80%' },
          { status: '良好', conditions: '点击率≥10% 且 消耗率≥50%' },
          { status: '一般', conditions: '点击率≥5% 且 消耗率≥30%' },
          { status: '需优化', conditions: '任一指标低于一般标准' },
          { status: '严重问题', conditions: '消耗率<30% 或 点击率<3%' },
        ],
      },
      {
        title: '调整动作参考',
        items: [
          { action: '提成本', trigger: '消耗率<30%', method: '提高出价20%' },
          { action: '养曝光', trigger: '提成本后仍消耗不好', method: '开曝光计划，日预算15元' },
          { action: '换素材', trigger: '点击率<5%', method: '更换主图/标题' },
          { action: '上新链接', trigger: '多次调整无效', method: '淘汰当前链接，重新赛马' },
        ],
      },
    ],
  };

  res.json({
    success: true,
    data: guide,
  });
});

/**
 * POST /api/v1/analytics/batch-report
 * 批量生成多账号复盘报告
 * Body: {
 *   reports: Array<{
 *     accountId: string,
 *     campaignId: string,
 *     currentData: {...},
 *     previousData?: {...},
 *     campaignType?: '曝光' | '咨询'
 *   }>
 * }
 */
router.post('/batch-report', async (req, res) => {
  try {
    const { reports } = req.body;

    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({
        success: false,
        error: '缺少 reports 参数或格式错误',
      });
    }

    const results = reports.map((item) => {
      const report = generateDailyReport(
        item.accountId,
        item.campaignId,
        item.currentData,
        item.previousData,
        item.campaignType || '咨询'
      );
      return {
        accountId: item.accountId,
        campaignId: item.campaignId,
        report,
        reportText: formatDailyReport(report),
      };
    });

    // 生成汇总报告
    const totalCost = results.reduce((sum, r) => sum + r.report.metrics.cost, 0);
    const totalConsults = results.reduce((sum, r) => sum + r.report.metrics.consults, 0);
    const avgBudgetUsedRate =
      results.reduce((sum, r) => sum + r.report.metrics.budgetUsedRate, 0) / results.length;
    const avgConsultCost =
      totalConsults > 0 ? totalCost / totalConsults : Infinity;

    const summary = {
      totalCost,
      totalConsults,
      avgBudgetUsedRate,
      avgConsultCost: avgConsultCost === Infinity ? null : avgConsultCost,
      accountCount: results.length,
      statusSummary: results.reduce((acc, r) => {
        acc[r.report.status] = (acc[r.report.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      success: true,
      data: {
        reports: results,
        summary,
      },
    });
  } catch (error: any) {
    console.error('批量报告生成失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
