/**
 * 聊天路由 - 处理用户对话（使用 Kimi AI）
 */

import { Router } from 'express';
import { parseIntent, chatWithAI, streamChatWithAI, getSOPInfo } from '../services/chatService';
import { bitBrowser } from '../services/bitBrowser';

const router = Router();

// 聊天消息历史（内存存储，MVP 阶段够用）
const chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = [];

/**
 * POST /api/v1/chat
 * 发送聊天消息（使用 Kimi AI）
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

    // 使用 Kimi AI 进行对话
    const reply = await chatWithAI(message, chatHistory);

    // 添加 AI 回复到历史
    chatHistory.push({
      role: 'assistant',
      content: reply,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      reply,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('聊天接口错误:', error);
    res.status(500).json({
      success: false,
      error: 'AI 服务暂时不可用',
    });
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
