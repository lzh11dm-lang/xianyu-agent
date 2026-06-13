/**
 * Kimi AI 服务
 * 使用 Kimi K2.5 模型进行智能对话
 * 
 * 注意：此 SDK 使用 Coze 平台凭证，无需手动配置 API Key
 * 模型凭证由 Coze 平台自动管理
 */
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 模型配置 - 使用 Kimi K2.5
const KIMI_MODEL = 'kimi-k2-5-260127';

// 系统提示词
const SYSTEM_PROMPT = `你是咸鱼运营专家 Agent，专门帮助用户管理闲鱼店铺和投流运营。

你的能力包括：
1. 上架商品到闲鱼
2. 创建和管理投流计划（大鱼平台）
3. 盯数据和每日复盘
4. 根据 SOP 流程给出调整建议
5. 管理多个闲鱼账号

当前支持的 SOP 流程：
- 上架5条链接 → 开曝光计划赛马（1-2小时）
- 选出1-2条优质链接 → 开咨询计划
- 每日盯数据，根据规则调整（提成本20% / 养曝光）
- 效果不行则上新链接继续赛马

请用简洁、专业的语言回答用户。如果涉及具体的投流操作，告知用户需要的参数（如出价、预算等）。`;

// 创建 Kimi 客户端（使用默认配置，自动从环境变量加载凭证）
function createKimiClient(): LLMClient {
  return new LLMClient(new Config());
}

/**
 * 发送消息给 Kimi 并获取回复
 */
export async function chatWithKimi(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const client = createKimiClient();

  // 构建消息列表
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    // 使用 invoke 方法（非流式）
    const response = await client.invoke(messages, {
      model: KIMI_MODEL,
      temperature: 0.6, // Kimi K2.5 非思考模式固定为 0.6
    });

    return response.content;
  } catch (error) {
    console.error('Kimi API 调用失败:', error);
    throw new Error('AI 服务暂时不可用，请稍后重试');
  }
}

/**
 * 流式发送消息给 Kimi
 */
export async function* streamChatWithKimi(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): AsyncGenerator<string> {
  const client = createKimiClient();

  // 构建消息列表
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const stream = client.stream(messages, {
      model: KIMI_MODEL,
      temperature: 0.6,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  } catch (error) {
    console.error('Kimi API 流式调用失败:', error);
    throw new Error('AI 服务暂时不可用，请稍后重试');
  }
}

export default { chatWithKimi, streamChatWithKimi };
