/**
 * 闲管家 API 配置服务
 * 管理闲管家的 API 密钥配置
 */

export interface XianGuanJiaConfig {
  enabled: boolean;
  appKey: string;
  apiSecret: string;
  shops: string[]; // 绑定的店铺名称
}

// 内存存储配置
let config: XianGuanJiaConfig = {
  enabled: false,
  appKey: '',
  apiSecret: '',
  shops: []
};

/**
 * 获取闲管家配置
 */
export function getConfig(): XianGuanJiaConfig {
  return config;
}

/**
 * 更新闲管家配置
 */
export function updateConfig(updates: Partial<XianGuanJiaConfig>): XianGuanJiaConfig {
  Object.assign(config, updates);
  return config;
}

/**
 * 启用/禁用闲管家
 */
export function setEnabled(enabled: boolean): XianGuanJiaConfig {
  config.enabled = enabled;
  return config;
}

/**
 * 配置 API 密钥
 */
export function setCredentials(appKey: string, apiSecret: string): XianGuanJiaConfig {
  config.appKey = appKey;
  config.apiSecret = apiSecret;
  return config;
}

/**
 * 添加店铺
 */
export function addShop(shopName: string): string[] {
  if (!config.shops.includes(shopName)) {
    config.shops.push(shopName);
  }
  return config.shops;
}

/**
 * 移除店铺
 */
export function removeShop(shopName: string): string[] {
  config.shops = config.shops.filter(s => s !== shopName);
  return config.shops;
}

/**
 * 验证闲管家配置
 */
export async function validateConfig(): Promise<{ success: boolean; message: string }> {
  if (!config.appKey || !config.apiSecret) {
    return { success: false, message: '请先配置 AppKey 和 ApiSecret' };
  }

  if (!config.enabled) {
    return { success: false, message: '闲管家 API 未启用' };
  }

  // 尝试调用闲管家 API 验证
  try {
    // 闲管家 API 验证地址（示例）
    const timestamp = Date.now();
    const sign = generateSign(config.appKey, config.apiSecret, timestamp);
    
    const response = await fetch('https://api.goofish.pro/goods/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': config.appKey,
        'X-Timestamp': timestamp.toString(),
        'X-Sign': sign
      },
      body: JSON.stringify({ page: 1, pageSize: 10 })
    });

    if (response.ok) {
      return { success: true, message: 'API 配置验证成功' };
    }
    
    return { success: false, message: 'API 验证失败，请检查密钥是否正确' };
  } catch (error) {
    return { success: false, message: '无法连接到闲管家 API' };
  }
}

/**
 * 生成签名（闲管家 API 安全机制）
 */
function generateSign(appKey: string, appSecret: string, timestamp: number): string {
  // 简化版签名生成，实际需要根据闲管家 API 文档实现
  const str = appKey + timestamp + appSecret;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 调用闲管家 API - 获取商品列表
 */
export async function getGoodsList(page: number = 1, pageSize: number = 20) {
  if (!config.enabled || !config.appKey || !config.apiSecret) {
    throw new Error('闲管家 API 未配置或未启用');
  }

  const timestamp = Date.now();
  const sign = generateSign(config.appKey, config.apiSecret, timestamp);

  const response = await fetch('https://api.goofish.pro/goods/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': config.appKey,
      'X-Timestamp': timestamp.toString(),
      'X-Sign': sign
    },
    body: JSON.stringify({ page, pageSize })
  });

  return response.json();
}

/**
 * 调用闲管家 API - 修改价格
 */
export async function updatePrice(itemId: string, price: number) {
  if (!config.enabled || !config.appKey || !config.apiSecret) {
    throw new Error('闲管家 API 未配置或未启用');
  }

  const timestamp = Date.now();
  const sign = generateSign(config.appKey, config.apiSecret, timestamp);

  const response = await fetch('https://api.goofish.pro/goods/price', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': config.appKey,
      'X-Timestamp': timestamp.toString(),
      'X-Sign': sign
    },
    body: JSON.stringify({ itemId, price })
  });

  return response.json();
}

/**
 * 调用闲管家 API - 修改库存
 */
export async function updateStock(itemId: string, stock: number) {
  if (!config.enabled || !config.appKey || !config.apiSecret) {
    throw new Error('闲管家 API 未配置或未启用');
  }

  const timestamp = Date.now();
  const sign = generateSign(config.appKey, config.apiSecret, timestamp);

  const response = await fetch('https://api.goofish.pro/goods/stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': config.appKey,
      'X-Timestamp': timestamp.toString(),
      'X-Sign': sign
    },
    body: JSON.stringify({ itemId, stock })
  });

  return response.json();
}

/**
 * 调用闲管家 API - 发货
 */
export async function shipOrder(orderId: string, logistics: { company: string; number: string }) {
  if (!config.enabled || !config.appKey || !config.apiSecret) {
    throw new Error('闲管家 API 未配置或未启用');
  }

  const timestamp = Date.now();
  const sign = generateSign(config.appKey, config.apiSecret, timestamp);

  const response = await fetch('https://api.goofish.pro/order/ship', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': config.appKey,
      'X-Timestamp': timestamp.toString(),
      'X-Sign': sign
    },
    body: JSON.stringify({ orderId, logistics })
  });

  return response.json();
}
