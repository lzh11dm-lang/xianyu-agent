import { Router } from 'express';
import {
  getConfig as getBitBrowserConfig,
  updateApiUrl,
  addSeat,
  removeSeat,
  updateSeat,
  getSeats,
  validateSeat
} from '../services/bitBrowserSeatService';
import {
  getConfig as getXianGuanJiaConfig,
  updateConfig,
  setEnabled,
  setCredentials,
  validateConfig,
  getGoodsList,
  updatePrice,
  updateStock
} from '../services/xianGuanJiaService';

const router = Router();

/**
 * 获取所有配置
 * GET /api/v1/config
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        bitBrowser: getBitBrowserConfig(),
        xianGuanJia: getXianGuanJiaConfig()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取配置失败' });
  }
});

/**
 * ========== 比特浏览器配置 ==========
 */

/**
 * 获取比特浏览器配置
 * GET /api/v1/config/bitbrowser
 */
router.get('/bitbrowser', (req, res) => {
  res.json({ success: true, data: getBitBrowserConfig() });
});

/**
 * 更新比特浏览器 API 地址
 * PUT /api/v1/config/bitbrowser/api-url
 */
router.put('/bitbrowser/api-url', (req, res) => {
  const { apiUrl } = req.body;
  if (!apiUrl) {
    return res.status(400).json({ success: false, message: '请提供 API 地址' });
  }
  const config = updateApiUrl(apiUrl);
  res.json({ success: true, data: config });
});

/**
 * 获取席位列表
 * GET /api/v1/config/bitbrowser/seats
 */
router.get('/bitbrowser/seats', (req, res) => {
  res.json({ success: true, data: getSeats() });
});

/**
 * 添加席位
 * POST /api/v1/config/bitbrowser/seats
 */
router.post('/bitbrowser/seats', (req, res) => {
  const { name, remark } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: '请提供席位名称' });
  }
  const seat = addSeat({ name, remark: remark || '' });
  res.json({ success: true, data: seat });
});

/**
 * 删除席位
 * DELETE /api/v1/config/bitbrowser/seats/:id
 */
router.delete('/bitbrowser/seats/:id', (req, res) => {
  const { id } = req.params;
  const success = removeSeat(id);
  if (success) {
    res.json({ success: true, message: '席位已删除' });
  } else {
    res.status(404).json({ success: false, message: '席位不存在' });
  }
});

/**
 * 更新席位
 * PUT /api/v1/config/bitbrowser/seats/:id
 */
router.put('/bitbrowser/seats/:id', (req, res) => {
  const { id } = req.params;
  const { name, remark } = req.body;
  const seat = updateSeat(id, { name, remark });
  if (seat) {
    res.json({ success: true, data: seat });
  } else {
    res.status(404).json({ success: false, message: '席位不存在' });
  }
});

/**
 * 验证席位
 * POST /api/v1/config/bitbrowser/seats/:id/validate
 */
router.post('/bitbrowser/seats/:id/validate', async (req, res) => {
  const { id } = req.params;
  const result = await validateSeat(id);
  res.json(result);
});

/**
 * ========== 闲管家配置 ==========
 */

/**
 * 获取闲管家配置
 * GET /api/v1/config/xianguanjia
 */
router.get('/xianguanjia', (req, res) => {
  const config = getXianGuanJiaConfig();
  // 隐藏密钥
  const safeConfig = {
    ...config,
    apiSecret: config.apiSecret ? '********' + config.apiSecret.slice(-4) : ''
  };
  res.json({ success: true, data: safeConfig });
});

/**
 * 更新闲管家配置
 * PUT /api/v1/config/xianguanjia
 */
router.put('/xianguanjia', (req, res) => {
  const { enabled, appKey, apiSecret, shops } = req.body;
  const config = updateConfig({ enabled, appKey, apiSecret, shops });
  res.json({ success: true, data: config });
});

/**
 * 启用/禁用闲管家
 * PUT /api/v1/config/xianguanjia/enabled
 */
router.put('/xianguanjia/enabled', (req, res) => {
  const { enabled } = req.body;
  const config = setEnabled(enabled);
  res.json({ success: true, data: config });
});

/**
 * 设置 API 密钥
 * PUT /api/v1/config/xianguanjia/credentials
 */
router.put('/xianguanjia/credentials', (req, res) => {
  const { appKey, apiSecret } = req.body;
  if (!appKey || !apiSecret) {
    return res.status(400).json({ success: false, message: '请提供 AppKey 和 ApiSecret' });
  }
  const config = setCredentials(appKey, apiSecret);
  res.json({ success: true, message: '密钥已保存' });
});

/**
 * 验证闲管家配置
 * POST /api/v1/config/xianguanjia/validate
 */
router.post('/xianguanjia/validate', async (req, res) => {
  const result = await validateConfig();
  res.json(result);
});

/**
 * 获取商品列表（需要闲管家 API）
 * GET /api/v1/config/xianguanjia/goods
 */
router.get('/xianguanjia/goods', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const data = await getGoodsList(page);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * 修改价格
 * POST /api/v1/config/xianguanjia/price
 */
router.post('/xianguanjia/price', async (req, res) => {
  try {
    const { itemId, price } = req.body;
    if (!itemId || !price) {
      return res.status(400).json({ success: false, message: '请提供商品ID和价格' });
    }
    const data = await updatePrice(itemId, price);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * 修改库存
 * POST /api/v1/config/xianguanjia/stock
 */
router.post('/xianguanjia/stock', async (req, res) => {
  try {
    const { itemId, stock } = req.body;
    if (!itemId || stock === undefined) {
      return res.status(400).json({ success: false, message: '请提供商品ID和库存' });
    }
    const data = await updateStock(itemId, stock);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
