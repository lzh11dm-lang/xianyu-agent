/**
 * 账号管理路由
 * 
 * 提供多账号管理接口
 */

import { Router } from 'express';
import { accountManager, type Account } from '../services/accountManager';

const router = Router();

/**
 * GET /api/v1/accounts
 * 获取所有账号
 */
router.get('/', (req, res) => {
  const accounts = accountManager.getAllAccounts();
  res.json({
    success: true,
    data: accounts,
  });
});

/**
 * GET /api/v1/accounts/summary
 * 获取账号汇总
 */
router.get('/summary', (req, res) => {
  const summary = accountManager.getSummary();
  res.json({
    success: true,
    data: summary,
  });
});

/**
 * GET /api/v1/accounts/:accountId
 * 获取单个账号
 */
router.get('/:accountId', (req, res) => {
  const { accountId } = req.params;
  const account = accountManager.getAccount(accountId);

  if (!account) {
    return res.status(404).json({
      success: false,
      error: '账号不存在',
    });
  }

  // 获取 SOP 状态
  const sop = accountManager.getSOPEngine(accountId);
  const dataHistory = accountManager.getDataHistory(accountId, 7);

  res.json({
    success: true,
    data: {
      ...account,
      sopPhase: sop?.getPhase(),
      sopStatus: sop?.getStatus(),
      recentData: dataHistory,
    },
  });
});

/**
 * PUT /api/v1/accounts/:accountId
 * 更新账号信息
 */
router.put('/:accountId', (req, res) => {
  const { accountId } = req.params;
  const { name, notes, status } = req.body;

  const updates: Partial<Account> = {};
  if (name !== undefined) updates.name = name;
  if (notes !== undefined) updates.notes = notes;
  if (status !== undefined) updates.status = status;

  const account = accountManager.updateAccount(accountId, updates);

  if (!account) {
    return res.status(404).json({
      success: false,
      error: '账号不存在',
    });
  }

  res.json({
    success: true,
    data: account,
  });
});

/**
 * POST /api/v1/accounts/:accountId/bind-browser
 * 绑定浏览器窗口
 * Body: { browserId: string }
 */
router.post('/:accountId/bind-browser', async (req, res) => {
  const { accountId } = req.params;
  const { browserId } = req.body;

  if (!browserId) {
    return res.status(400).json({
      success: false,
      error: '缺少 browserId',
    });
  }

  const success = await accountManager.bindBrowser(accountId, browserId);

  if (!success) {
    return res.status(400).json({
      success: false,
      error: '绑定失败，请检查浏览器是否存在',
    });
  }

  const account = accountManager.getAccount(accountId);
  res.json({
    success: true,
    data: account,
  });
});

/**
 * POST /api/v1/accounts/:accountId/unbind-browser
 * 解绑浏览器窗口
 */
router.post('/:accountId/unbind-browser', (req, res) => {
  const { accountId } = req.params;

  const success = accountManager.unbindBrowser(accountId);

  if (!success) {
    return res.status(400).json({
      success: false,
      error: '解绑失败',
    });
  }

  const account = accountManager.getAccount(accountId);
  res.json({
    success: true,
    data: account,
  });
});

/**
 * POST /api/v1/accounts/:accountId/reset
 * 重置账号（清空 SOP 状态）
 */
router.post('/:accountId/reset', (req, res) => {
  const { accountId } = req.params;

  const success = accountManager.resetAccount(accountId);

  if (!success) {
    return res.status(404).json({
      success: false,
      error: '账号不存在',
    });
  }

  res.json({
    success: true,
    message: '账号已重置',
  });
});

/**
 * POST /api/v1/accounts/:accountId/add-data
 * 添加数据记录
 * Body: { impressions, views, clicks, consults, cost }
 */
router.post('/:accountId/add-data', (req, res) => {
  const { accountId } = req.params;
  const { impressions, views, clicks, consults, cost } = req.body;

  if (
    impressions === undefined ||
    views === undefined ||
    clicks === undefined ||
    consults === undefined ||
    cost === undefined
  ) {
    return res.status(400).json({
      success: false,
      error: '缺少必要参数',
    });
  }

  const success = accountManager.addDataHistory(accountId, {
    impressions,
    views,
    clicks,
    consults,
    cost,
  });

  if (!success) {
    return res.status(404).json({
      success: false,
      error: '账号不存在',
    });
  }

  res.json({
    success: true,
    message: '数据已添加',
  });
});

/**
 * GET /api/v1/accounts/:accountId/history
 * 获取数据历史
 * Query: days = 7
 */
router.get('/:accountId/history', (req, res) => {
  const { accountId } = req.params;
  const days = parseInt(req.query.days as string) || 7;

  const history = accountManager.getDataHistory(accountId, days);
  const yesterday = accountManager.getYesterdayData(accountId);

  res.json({
    success: true,
    data: {
      history,
      yesterday,
    },
  });
});

/**
 * GET /api/v1/accounts/:accountId/sop
 * 获取账号 SOP 状态
 */
router.get('/:accountId/sop', (req, res) => {
  const { accountId } = req.params;

  const sop = accountManager.getSOPEngine(accountId);
  if (!sop) {
    return res.status(404).json({
      success: false,
      error: '账号不存在',
    });
  }

  res.json({
    success: true,
    data: sop.getStatus(),
  });
});

/**
 * POST /api/v1/accounts/:accountId/sop/evaluate
 * 评估账号 SOP
 * Body: { impressions, views, clicks, consults, cost, dailyBudget }
 */
router.post('/:accountId/sop/evaluate', (req, res) => {
  const { accountId } = req.params;
  const { impressions, views, clicks, consults, cost, dailyBudget } = req.body;

  const sop = accountManager.getSOPEngine(accountId);
  if (!sop) {
    return res.status(404).json({
      success: false,
      error: '账号不存在',
    });
  }

  try {
    const result = sop.evaluate({
      impressions,
      views,
      clicks,
      consults,
      cost,
      dailyBudget,
    });

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
 * POST /api/v1/accounts/:accountId/sop/adjust
 * 执行 SOP 调整
 * Body: { action: '提成本' | '养曝光' | '上新链接' | '换素材' }
 */
router.post('/:accountId/sop/adjust', (req, res) => {
  const { accountId } = req.params;
  const { action, data } = req.body;

  const sop = accountManager.getSOPEngine(accountId);
  if (!sop) {
    return res.status(404).json({
      success: false,
      error: '账号不存在',
    });
  }

  try {
    const result = sop.executeAdjustment(action, data);

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

export default router;
