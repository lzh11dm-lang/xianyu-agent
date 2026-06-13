/**
 * 浏览器控制路由 - 直接操作比特浏览器
 */

import { Router } from 'express';
import { bitBrowser } from '../services/bitBrowser';

const router = Router();

// 大鱼平台 URL
const DAYU_URL = 'https://ad.xianyu.1688.com';

/**
 * GET /api/v1/browser/status
 * 检查比特浏览器连接状态
 */
router.get('/status', async (req, res) => {
  try {
    const result = await bitBrowser.listBrowsers();
    res.json({
      success: result.success,
      connected: result.success,
      browsers: result.data || [],
      message: result.msg,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      connected: false,
      message: '服务器错误',
    });
  }
});

/**
 * GET /api/v1/browser/list
 * 获取浏览器列表
 */
router.get('/list', async (req, res) => {
  try {
    const result = await bitBrowser.listBrowsers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '服务器错误' });
  }
});

/**
 * POST /api/v1/browser/open-tab
 * 打开新标签页
 */
router.post('/open-tab', async (req, res) => {
  try {
    const { browserId, url } = req.body;

    if (!browserId) {
      return res.status(400).json({ success: false, msg: '缺少 browserId 参数' });
    }

    const targetUrl = url || DAYU_URL;
    const result = await bitBrowser.openNewTab(browserId, targetUrl);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '服务器错误' });
  }
});

/**
 * POST /api/v1/browser/execute
 * 执行 JavaScript 脚本
 */
router.post('/execute', async (req, res) => {
  try {
    const { browserId, script } = req.body;

    if (!browserId || !script) {
      return res.status(400).json({ success: false, msg: '缺少必要参数' });
    }

    const result = await bitBrowser.executeScript(browserId, script);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '服务器错误' });
  }
});

/**
 * POST /api/v1/browser/screenshot
 * 截图
 */
router.post('/screenshot', async (req, res) => {
  try {
    const { browserId } = req.body;

    if (!browserId) {
      return res.status(400).json({ success: false, msg: '缺少 browserId 参数' });
    }

    const result = await bitBrowser.screenshot(browserId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: '服务器错误' });
  }
});

/**
 * POST /api/v1/browser/open-dayu
 * 打开大鱼投流平台
 */
router.post('/open-dayu', async (req, res) => {
  try {
    const { browserId } = req.body;

    if (!browserId) {
      return res.status(400).json({ success: false, msg: '缺少 browserId 参数' });
    }

    const result = await bitBrowser.openNewTab(browserId, DAYU_URL);
    res.json({
      ...result,
      url: DAYU_URL,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: '服务器错误' });
  }
});

/**
 * GET /api/v1/browser/actions
 * 获取可用操作列表
 */
router.get('/actions', (req, res) => {
  res.json({
    success: true,
    actions: [
      {
        id: 'open_dayu',
        name: '打开大鱼平台',
        description: '在指定浏览器窗口中打开大鱼投流平台',
        params: ['browserId'],
      },
      {
        id: 'get_page_source',
        name: '获取页面内容',
        description: '获取当前页面的 HTML 内容',
        params: ['browserId'],
      },
      {
        id: 'click_element',
        name: '点击元素',
        description: '通过 CSS 选择器点击页面元素',
        params: ['browserId', 'selector'],
      },
      {
        id: 'fill_input',
        name: '填写输入框',
        description: '通过 CSS 选择器填写输入框',
        params: ['browserId', 'selector', 'value'],
      },
      {
        id: 'execute_script',
        name: '执行脚本',
        description: '在页面中执行 JavaScript 代码',
        params: ['browserId', 'script'],
      },
      {
        id: 'screenshot',
        name: '页面截图',
        description: '截取当前页面快照',
        params: ['browserId'],
      },
    ],
  });
});

export default router;
