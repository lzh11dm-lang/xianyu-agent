/**
 * 大鱼平台路由
 */

import { Router } from 'express';
import { dayuPlatform } from '../services/dayuPlatform';

const router = Router();

/**
 * GET /api/v1/dayu/status
 * 检查大鱼平台连接状态
 */
router.get('/status', async (req, res) => {
  try {
    res.json({ success: true, msg: '大鱼平台服务就绪' });
  } catch (error) {
    res.status(500).json({ success: false, msg: '服务异常' });
  }
});

/**
 * POST /api/v1/dayu/create-exposure
 * 创建曝光计划
 * Body: { launchId, productLink, bid?, dailyBudget? }
 */
router.post('/create-exposure', async (req, res) => {
  try {
    const { launchId, productLink, bid, dailyBudget } = req.body;

    if (!launchId || !productLink) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await dayuPlatform.createExposurePlan({
      launchId,
      productLink,
      bid: bid || 20,
      dailyBudget: dailyBudget || 40
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '创建曝光计划失败' });
  }
});

/**
 * POST /api/v1/dayu/create-consult
 * 创建咨询计划
 * Body: { launchId, productLinks, costBid, dailyBudget? }
 */
router.post('/create-consult', async (req, res) => {
  try {
    const { launchId, productLinks, costBid, dailyBudget } = req.body;

    if (!launchId || !productLinks || !costBid) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await dayuPlatform.createConsultPlan({
      launchId,
      productLinks,
      costBid,
      dailyBudget: dailyBudget || 50
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '创建咨询计划失败' });
  }
});

/**
 * POST /api/v1/dayu/adjust-bid
 * 调整出价
 * Body: { launchId, planId, newBid }
 */
router.post('/adjust-bid', async (req, res) => {
  try {
    const { launchId, planId, newBid } = req.body;

    if (!launchId || !newBid) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await dayuPlatform.adjustBid(launchId, planId || '', newBid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '调整出价失败' });
  }
});

/**
 * POST /api/v1/dayu/pause
 * 暂停计划
 * Body: { launchId, planId }
 */
router.post('/pause', async (req, res) => {
  try {
    const { launchId, planId } = req.body;

    if (!launchId) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await dayuPlatform.pausePlan(launchId, planId || '');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '暂停计划失败' });
  }
});

/**
 * POST /api/v1/dayu/start
 * 启动计划
 * Body: { launchId, planId }
 */
router.post('/start', async (req, res) => {
  try {
    const { launchId, planId } = req.body;

    if (!launchId) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await dayuPlatform.startPlan(launchId, planId || '');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '启动计划失败' });
  }
});

/**
 * GET /api/v1/dayu/plans
 * 获取投流计划列表
 * Query: { launchId }
 */
router.get('/plans', async (req, res) => {
  try {
    const { launchId } = req.query;

    if (!launchId) {
      return res.status(400).json({ success: false, msg: '缺少launchId参数' });
    }

    const result = await dayuPlatform.getPlanList(launchId as string);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '获取计划列表失败' });
  }
});

/**
 * GET /api/v1/dayu/plan-data
 * 获取计划详细数据
 * Query: { launchId, planId? }
 */
router.get('/plan-data', async (req, res) => {
  try {
    const { launchId, planId } = req.query;

    if (!launchId) {
      return res.status(400).json({ success: false, msg: '缺少launchId参数' });
    }

    const result = await dayuPlatform.getPlanData(launchId as string, planId as string | undefined);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '获取计划数据失败' });
  }
});

/**
 * POST /api/v1/dayu/exposure-boost
 * 执行曝光养计划操作
 * Body: { launchId, productLinks }
 */
router.post('/exposure-boost', async (req, res) => {
  try {
    const { launchId, productLinks } = req.body;

    if (!launchId || !productLinks || productLinks.length === 0) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await dayuPlatform.doExposureBoost(launchId, productLinks);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '执行曝光养计划失败' });
  }
});

export default router;
