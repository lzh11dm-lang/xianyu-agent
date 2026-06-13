/**
 * 聊天服务 - 使用 Kimi AI 进行智能对话
 */

import { chatWithKimi, streamChatWithKimi } from './kimiService';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface IntentResult {
  intent: string;
  params: Record<string, any>;
  response: string;
}

/**
 * 使用 Kimi AI 进行对话
 */
export async function chatWithAI(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  try {
    // 将历史消息转换为 Kimi 格式
    const conversationHistory = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // 调用 Kimi API
    const response = await chatWithKimi(message, conversationHistory);
    return response;
  } catch (error) {
    console.error('Kimi AI 调用失败:', error);
    // 如果 Kimi 失败，fallback 到规则匹配
    return fallbackToRuleBased(message);
  }
}

/**
 * 流式对话
 */
export async function* streamChatWithAI(
  message: string,
  history: ChatMessage[] = []
): AsyncGenerator<string> {
  try {
    const conversationHistory = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    yield* streamChatWithKimi(message, conversationHistory);
  } catch (error) {
    console.error('Kimi AI 流式调用失败:', error);
    yield 'AI 服务暂时不可用，请稍后重试。';
  }
}

/**
 * Fallback 到规则匹配
 */
function fallbackToRuleBased(message: string): string {
  const msg = message.toLowerCase().trim();

  // 连接浏览器
  if (msg.includes('连接') && (msg.includes('浏览器') || msg.includes('比特'))) {
    return '好的，正在连接比特浏览器...';
  }

  // 查看账号
  if (msg.includes('账号') || msg.includes('账户')) {
    return '好的，正在查看账号状态...\n\n请在设置页面中添加你的比特浏览器席位。';
  }

  // 查看 SOP
  if (msg.includes('sop') || msg.includes('流程') || msg.includes('步骤')) {
    return `📋 闲鱼投流 SOP 流程：

**阶段一：上架 + 曝光赛马**
- 上架 5 条同类链接
- 开曝光计划（出价 20 元，日预算 40 元）
- 跑 1-2 小时后选出 1-2 条优质链接

**阶段二：咨询计划**
- 选出 1-2 条链接
- 开咨询计划（120% 成本出价，日预算 50 元）
- 补单动作

**阶段三：观察 + 调整**
- 每日盯数据
- 点击率低 → 换主图/标题
- 消耗不出去 → 提成本 20%
- 还不出去 → 养曝光（日预算 15 元跑 2-3 天）

**阶段四：淘汰**
- 优化动作都做完仍不行 → 上新链接继续赛马`;
  }

  // 数据分析
  if (msg.includes('数据') || msg.includes('分析')) {
    return '好的，正在分析数据...\n\n请问你想分析哪个账号的数据？或者直接告诉我你观察到的问题。';
  }

  // 默认回复
  return `我理解了你的问题。\n\n作为咸鱼运营 Agent，我可以帮你：\n• 上架商品\n• 管理投流计划\n• 盯数据和复盘\n• 根据 SOP 给出调整建议\n\n请具体告诉我你想做什么？`;
}

/**
 * 意图识别（保留用于简单指令）
 */
export function parseIntent(message: string): IntentResult {
  const msg = message.toLowerCase().trim();

  // 连接浏览器
  if (msg.includes('连接') && (msg.includes('浏览器') || msg.includes('比特'))) {
    return {
      intent: 'connect_browser',
      params: {},
      response: '好的，正在连接比特浏览器...',
    };
  }

  // 创建曝光计划
  if (
    (msg.includes('曝光') || msg.includes('计划')) &&
    (msg.includes('新建') || msg.includes('创建') || msg.includes('开'))
  ) {
    return {
      intent: 'create_exposure_plan',
      params: {
        bid: 20,      // 出价 20 元
        budget: 40,   // 日预算 40 元
      },
      response: '好的，正在按 SOP 创建曝光计划（出价 20 元，日预算 40 元）...',
    };
  }

  // 创建咨询计划
  if (
    (msg.includes('咨询') || msg.includes('转化')) &&
    (msg.includes('计划') || msg.includes('新建') || msg.includes('创建') || msg.includes('开'))
  ) {
    return {
      intent: 'create_consult_plan',
      params: {
        costMultiplier: 1.2,  // 120% 成本出价
        budget: 50,          // 日预算 50 元/条
      },
      response: '好的，正在按 SOP 创建咨询计划（120% 成本出价，日预算 50 元）...',
    };
  }

  // 查看投流数据
  if (msg.includes('看') && (msg.includes('数据') || msg.includes('计划') || msg.includes('消耗') || msg.includes('咨询'))) {
    return {
      intent: 'view_plan_data',
      params: {},
      response: '好的，正在获取投流数据...',
    };
  }

  // 查看账号状态
  if (msg.includes('账号') || msg.includes('账户')) {
    return {
      intent: 'check_account',
      params: {},
      response: '好的，正在检查账号状态...',
    };
  }

  // 打开大鱼平台
  if (msg.includes('大鱼') || msg.includes('超级擦亮') || msg.includes('投流后台')) {
    return {
      intent: 'open_ad_platform',
      params: {},
      response: '好的，正在打开大鱼投流平台...',
    };
  }

  // 默认：闲聊
  return {
    intent: 'chat',
    params: {},
    response: `我理解你想说：${message}\n\n目前 MVP 版本支持以下指令：\n• 连接浏览器\n• 新建曝光计划\n• 新建咨询计划\n• 查看投流数据\n• 打开大鱼平台\n\n请告诉我你想做什么？`,
  };
}

/**
 * 获取 SOP 说明
 */
export function getSOPInfo(): string {
  return `
📋 咸鱼投流 SOP v1.0

【第一阶段】上架 + 曝光计划
1. 上架 5 条链接
2. 开曝光计划（出价 20 元，日预算 40 元）
3. 跑 1-2 小时
4. 选出 1-2 条优质链接

【第二阶段】咨询计划
1. 选出优质链接
2. 开咨询计划（出价 120% 成本，日预算 50 元/条）
3. 补单
4. 跑 1-2 天

【第三阶段】观察与调整
• 消耗不出去 → 成本提高 20%，跑 1 天
• 仍不行 → 停咨询，开曝光计划养曝光（2 条，日预算 15 元）
• 2-3 天后重新开咨询计划
• 还不行 → 淘汰，上新链接继续赛马

【第四阶段】链接优化
• 点击率/浏览率低 → 换主图/标题 → 重新执行调整流程
`;
}
