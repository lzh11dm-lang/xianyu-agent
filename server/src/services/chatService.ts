/**
 * 聊天服务 - 解析用户意图并执行对应操作
 */

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
 * 意图识别
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
