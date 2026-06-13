/**
 * 闲鱼平台路由
 */

import { Router } from 'express';
import { xianyuPlatform } from '../services/xianyuPlatform';

const router = Router();

/**
 * GET /api/v1/xianyu/status
 * 检查闲鱼平台连接状态
 */
router.get('/status', async (req, res) => {
  try {
    res.json({ success: true, msg: '闲鱼平台服务就绪' });
  } catch (error) {
    res.status(500).json({ success: false, msg: '服务异常' });
  }
});

/**
 * POST /api/v1/xianyu/publish
 * 发布商品
 * Body: { launchId, title, description, price, category?, images? }
 */
router.post('/publish', async (req, res) => {
  try {
    const { launchId, title, description, price, category, images } = req.body;

    if (!launchId || !title || !description || !price) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await xianyuPlatform.publishProduct({
      launchId,
      productInfo: { title, description, price, category, images }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '发布商品失败' });
  }
});

/**
 * GET /api/v1/xianyu/products
 * 获取商品列表
 * Query: { launchId }
 */
router.get('/products', async (req, res) => {
  try {
    const { launchId } = req.query;

    if (!launchId) {
      return res.status(400).json({ success: false, msg: '缺少launchId参数' });
    }

    const result = await xianyuPlatform.getProductList(launchId as string);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '获取商品列表失败' });
  }
});

/**
 * POST /api/v1/xianyu/unpublish
 * 下架商品
 * Body: { launchId, productId }
 */
router.post('/unpublish', async (req, res) => {
  try {
    const { launchId, productId } = req.body;

    if (!launchId || !productId) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await xianyuPlatform.unpublishProduct(launchId, productId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '下架商品失败' });
  }
});

/**
 * POST /api/v1/xianyu/update-price
 * 修改商品价格
 * Body: { launchId, productId, newPrice }
 */
router.post('/update-price', async (req, res) => {
  try {
    const { launchId, productId, newPrice } = req.body;

    if (!launchId || !productId || !newPrice) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await xianyuPlatform.updatePrice(launchId, productId, newPrice);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '修改价格失败' });
  }
});

/**
 * POST /api/v1/xianyu/batch-update-price
 * 批量修改价格
 * Body: { launchId, priceChange }
 */
router.post('/batch-update-price', async (req, res) => {
  try {
    const { launchId, priceChange } = req.body;

    if (!launchId || priceChange === undefined) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await xianyuPlatform.batchUpdatePrice(launchId, priceChange);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '批量修改价格失败' });
  }
});

/**
 * GET /api/v1/xianyu/orders
 * 获取订单列表
 * Query: { launchId }
 */
router.get('/orders', async (req, res) => {
  try {
    const { launchId } = req.query;

    if (!launchId) {
      return res.status(400).json({ success: false, msg: '缺少launchId参数' });
    }

    const result = await xianyuPlatform.getOrderList(launchId as string);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '获取订单列表失败' });
  }
});

export default router;
