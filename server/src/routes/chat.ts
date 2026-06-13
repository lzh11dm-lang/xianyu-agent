/**
 * 聊天路由 - 处理用户对话
 */

import { Router } from 'express';
import { parseIntent, getSOPInfo } from '../services/chatService';
import { bitBrowser } from '../services/bitBrowser';

const router = Router();

// 聊天消息历史（内存存储，MVP 阶段够用）
const chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = [];

// 系统提示
const systemPrompt = `你是咸鱼投流运营助手，代号"咸鱼小智"。
你的职责是帮助用户管理咸鱼店铺的投流工作。
你有完整的咸鱼投流 SOP 知识，可以指导用户执行正确的操作。
当用户描述不清楚时，引导用户说清楚。
保持专业、简洁、高效的风格。`;

/**
 * POST /api/v1/chat
 * 发送聊天消息
 */
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 添加用户消息到历史
    chatHistory.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    // 限制历史记录长度
    if (chatHistory.length > 50) {
      chatHistory.shift();
    }

    // 解析意图
    const intentResult = parseIntent(message);

    // 根据意图执行操作并生成回复
    let reply = intentResult.response;

    switch (intentResult.intent) {
      case 'connect_browser':
        const connectResult = await bitBrowser.listBrowsers();
        if (connectResult.success && connectResult.data) {
          reply += `\n\n✅ 已找到 ${connectResult.data.length} 个浏览器窗口`;
        } else {
          reply += `\n\n❌ ${connectResult.msg || '连接失败'}\n\n请确保比特浏览器已启动！`;
        }
        break;

      case 'check_account':
        const listResult = await bitBrowser.listBrowsers();
        if (listResult.success && listResult.data) {
          const accounts = listResult.data
            .map((b, i) => `${i + 1}. ${b.name || b.remarks || b.id} (${b.status})`)
            .join('\n');
          reply = `📱 当前已连接的账号：\n\n${accounts || '暂无连接'}`;
        } else {
          reply = `❌ ${listResult.msg || '获取账号失败'}\n\n请确保比特浏览器已启动！`;
        }
        break;

      case 'open_ad_platform':
        // 打开大鱼平台
        reply += '\n\n请告诉我你想用哪个账号（几号席位）？';
        break;

      case 'create_exposure_plan':
        reply += '\n\n请先告诉我：\n1. 用哪个账号（几号席位）？\n2. 选择哪两条链接放入计划？';
        break;

      case 'create_consult_plan':
        reply += '\n\n请先告诉我：\n1. 用哪个账号（几号席位）？\n2. 两条链接是否已经选好？';
        break;

      case 'view_plan_data':
        reply += '\n\n请先告诉我查看哪个账号的数据？';
        break;

      case 'chat':
        if (message.includes('sop') || message.includes('流程')) {
          reply = getSOPInfo();
        }
        break;
    }

    // 添加助手回复到历史
    chatHistory.push({
      role: 'assistant',
      content: reply,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      reply,
      intent: intentResult.intent,
      params: intentResult.params,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/v1/chat/history
 * 获取聊天历史
 */
router.get('/history', (req, res) => {
  res.json({
    success: true,
    history: chatHistory,
  });
});

/**
 * DELETE /api/v1/chat/history
 * 清空聊天历史
 */
router.delete('/history', (req, res) => {
  chatHistory.length = 0;
  res.json({
    success: true,
    message: '聊天历史已清空',
  });
});

export default router;
