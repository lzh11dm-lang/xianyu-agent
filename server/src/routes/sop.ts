/**
 * SOP 运营路由
 * 
 * 提供完整的投流 SOP 管理接口
 */

import express from 'express';
import { SOPEngine } from '../services/sopEngine';
import type { CampaignData, SOPResult, SOPReport } from '../services/sopEngine';
import { bitBrowser } from '../services/bitBrowser';
import { dayuPlatform } from '../services/dayuPlatform';

const router = express.Router();

// 存储各账号的 SOP 实例
const sopInstances: Map<string, SOPEngine> = new Map();

/**
 * 获取或创建 SOP 实例
 */
function getOrCreateSOP(accountId: string): SOPEngine {
  if (!sopInstances.has(accountId)) {
    sopInstances.set(accountId, new SOPEngine(accountId));
  }
  return sopInstances.get(accountId)!;
}

/**
 * 获取账号 SOP 状态
 * GET /api/v1/sop/status/:accountId
 */
router.get('/status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const sop = getOrCreateSOP(accountId);
    const status = sop.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 启动 SOP 流程（上架阶段）
 * POST /api/v1/sop/start
 * Body: { accountId: string, productIds: string[] }
 */
router.post('/start', async (req, res) => {
  try {
    const { accountId, productIds } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: '缺少账号 ID',
      });
    }

    const sop = getOrCreateSOP(accountId);

    // 设置选出的优质链接
    if (productIds && productIds.length > 0) {
      sop.setSelectedProducts(productIds);
    }

    // 执行上架阶段
    const result = sop.evaluate({} as CampaignData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 创建曝光计划（赛马阶段）
 * POST /api/v1/sop/exposure-plan
 * Body: { accountId: string, browserId: string, productIds: string[] }
 */
router.post('/exposure-plan', async (req, res) => {
  try {
    const { accountId, browserId, productIds } = req.body;

    if (!accountId || !browserId) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const sop = getOrCreateSOP(accountId);
    sop.advancePhase('曝光赛马');

    // 调用大鱼平台创建曝光计划
    const campaign = await dayuPlatform.createExposurePlan({
      launchId: browserId,
      bid: 20,
      dailyBudget: 40,
      productLink: productIds?.[0] || '',
    });

    res.json({
      success: true,
      data: {
        message: '曝光计划创建成功，开始赛马',
        campaign,
        nextStep: '等待 1-2 小时后评估效果',
        tips: [
          '赛马阶段不需要人工干预',
          '1-2 小时后回来查看结果',
          '系统会自动选出优质链接',
        ],
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 创建咨询计划
 * POST /api/v1/sop/consult-plan
 * Body: { accountId: string, browserId: string, productIds: string[], costBidPrice: number }
 */
router.post('/consult-plan', async (req, res) => {
  try {
    const { accountId, browserId, productIds, costBidPrice } = req.body;

    if (!accountId || !browserId) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const sop = getOrCreateSOP(accountId);
    sop.advancePhase('咨询投放');

    // 计算 120% 成本出价
    const bidPrice = costBidPrice ? costBidPrice * 1.2 : 6; // 默认 6 元

    // 调用大鱼平台创建咨询计划
    const campaign = await dayuPlatform.createConsultPlan({
      launchId: browserId,
      costBid: bidPrice,
      dailyBudget: 50,
      productLinks: productIds || [],
    });

    res.json({
      success: true,
      data: {
        message: '咨询计划创建成功',
        campaign,
        settings: {
          type: '咨询',
          bidPrice,
          dailyBudget: 50,
          bidPriceTip: `120% 成本出价 = ${costBidPrice} × 1.2 = ${bidPrice} 元`,
        },
        nextStep: '人工补单，等待 1-2 天观察效果',
        tips: [
          '创建计划后需要人工补单',
          '补单后再等待 1-2 天观察',
          '观察期间保持正常运营',
        ],
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 评估当前计划状态
 * POST /api/v1/sop/evaluate
 * Body: { accountId: string, data: CampaignData }
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { accountId, data } = req.body;

    if (!accountId || !data) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const sop = getOrCreateSOP(accountId);

    // 更新运行天数
    if (data.daysRunning) {
      sop.updateDaysRunning(data.daysRunning);
    }

    // 评估数据
    const result = sop.evaluate(data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 执行调整动作
 * POST /api/v1/sop/adjust
 * Body: { accountId: string, action: string, data?: any }
 */
router.post('/adjust', async (req, res) => {
  try {
    const { accountId, action, data } = req.body;

    if (!accountId || !action) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const sop = getOrCreateSOP(accountId);
    const result = sop.executeAdjustment(action as any, data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 获取 SOP 报告
 * GET /api/v1/sop/report/:accountId
 */
router.get('/report/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const sop = getOrCreateSOP(accountId);
    const report = sop.generateReport();

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 获取 SOP 阶段指引
 * GET /api/v1/sop/guide/:accountId
 */
router.get('/guide/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const sop = getOrCreateSOP(accountId);
    const status = sop.getStatus();

    // 根据当前阶段返回对应的操作指引
    const guides: Record<string, any> = {
      '上架': {
        title: '上架阶段',
        steps: [
          '准备好 5 条新链接的文案和图片',
          '点击「开始上架」按钮',
          '系统会自动创建曝光计划开始赛马',
        ],
        tips: [
          '5 条链接可以是同一品类的不同款式',
          '文案建议突出卖点，避免违规词',
          '图片建议清晰明亮，实物拍摄',
        ],
      },
      '曝光赛马': {
        title: '曝光计划赛马阶段',
        steps: [
          '曝光计划已创建，设置：出价 20 元，日预算 40 元',
          '等待 1-2 小时让计划跑出数据',
          '系统会自动评估哪条链接表现好',
        ],
        tips: [
          '赛马期间不要频繁调整',
          '让子弹飞一会儿',
          '1-2 小时后再来看结果',
        ],
      },
      '咨询投放': {
        title: '咨询计划投放阶段',
        steps: [
          '已选出优质链接，创建咨询计划',
          '出价：120% 成本出价（系统推荐）',
          '日预算：50 元/条',
          '人工进行补单操作',
          '等待 1-2 天观察效果',
        ],
        tips: [
          '补单是人工操作，需要你自行完成',
          '补单后等待 1-2 天观察数据',
          '关注消耗速度和咨询转化',
        ],
      },
      '观察期': {
        title: '7 天观察期',
        steps: [
          '每日查看数据：消耗、咨询、点击率',
          '判断是否消耗不出去',
          '点击率是否正常',
          '根据数据决定是否调整',
        ],
        tips: [
          '正常消耗率应 > 50%',
          '点击率正常范围 3%-10%',
          '咨询成本视品类而定',
        ],
      },
      '调整期': {
        title: '调整优化阶段',
        steps: [
          '消耗不出去时，首先提高出价 20%',
          '如果还是不行，改开曝光计划养曝光',
          '养 2-3 天后再重新开咨询',
          '多次调整无效则上新链接',
        ],
        tips: [
          '提成本动作：当前出价 × 1.2',
          '养曝光：日预算 15 元，跑 2-3 天',
          '换素材：更换主图/标题后重新观察',
        ],
      },
      '淘汰': {
        title: '链接淘汰',
        steps: [
          '该链接表现持续不佳',
          '保留当前优质链接',
          '准备上新链接继续测试',
        ],
        tips: [
          '不是所有链接都能爆',
          '快速淘汰快速测试',
          '保持测品的节奏',
        ],
      },
    };

    res.json({
      success: true,
      data: {
        currentPhase: status.phase,
        guide: guides[status.phase] || guides['上架'],
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 一键开始 SOP（全自动流程）
 * POST /api/v1/sop/auto-start
 * Body: { accountId: string, browserId: string, productIds: string[], autoMode: boolean }
 */
router.post('/auto-start', async (req, res) => {
  try {
    const { accountId, browserId, productIds, autoMode = false } = req.body;

    if (!accountId || !browserId) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const sop = getOrCreateSOP(accountId);

    // 阶段 1: 创建曝光计划
    sop.advancePhase('曝光赛马');
    
    const exposureCampaign = await dayuPlatform.createExposurePlan({
      launchId: browserId,
      bid: 20,
      dailyBudget: 40,
      productLink: productIds?.[0] || '',
    });

    res.json({
      success: true,
      data: {
        message: 'SOP 已启动，曝光计划创建成功',
        currentPhase: '曝光赛马',
        campaign: exposureCampaign,
        settings: {
          type: '曝光',
          bidPrice: 20,
          dailyBudget: 40,
        },
        nextSteps: autoMode ? [] : [
          '等待 1-2 小时后回来评估效果',
          '优质链接会被自动选出',
          '然后系统会提示创建咨询计划',
        ],
        autoMode,
        tips: autoMode 
          ? ['自动模式已开启，系统会持续监控数据']
          : ['建议手动模式，便于你随时观察调整'],
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
