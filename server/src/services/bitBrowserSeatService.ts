/**
 * 比特浏览器席位配置服务
 * 管理多个浏览器窗口的席位配置
 */

export interface BrowserSeat {
  id: string;
  name: string;
  remark: string;
  createdAt: string;
}

export interface BitBrowserConfig {
  apiUrl: string;
  seats: BrowserSeat[];
}

// 内存存储配置
let config: BitBrowserConfig = {
  apiUrl: 'http://127.0.0.1:54345',
  seats: []
};

/**
 * 获取比特浏览器配置
 */
export function getConfig(): BitBrowserConfig {
  return config;
}

/**
 * 更新比特浏览器 API 地址
 */
export function updateApiUrl(apiUrl: string): BitBrowserConfig {
  config.apiUrl = apiUrl;
  return config;
}

/**
 * 添加席位
 */
export function addSeat(seat: Omit<BrowserSeat, 'id' | 'createdAt'>): BrowserSeat {
  const newSeat: BrowserSeat = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...seat
  };
  config.seats.push(newSeat);
  return newSeat;
}

/**
 * 删除席位
 */
export function removeSeat(seatId: string): boolean {
  const index = config.seats.findIndex(s => s.id === seatId);
  if (index !== -1) {
    config.seats.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * 更新席位
 */
export function updateSeat(seatId: string, updates: Partial<BrowserSeat>): BrowserSeat | null {
  const seat = config.seats.find(s => s.id === seatId);
  if (seat) {
    Object.assign(seat, updates);
    return seat;
  }
  return null;
}

/**
 * 获取席位列表
 */
export function getSeats(): BrowserSeat[] {
  return config.seats;
}

/**
 * 获取单个席位
 */
export function getSeat(seatId: string): BrowserSeat | undefined {
  return config.seats.find(s => s.id === seatId);
}

/**
 * 验证席位是否可用（通过比特浏览器 API）
 */
export async function validateSeat(seatId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${config.apiUrl}/v1/browser/list`);
    const data = await response.json() as { code?: number; success?: boolean; data?: any[] };
    
    if (data.code === 0 || data.success) {
      // 检查 seatId 是否在浏览器列表中
      const windows = data.data || [];
      const window = windows.find((w: any) => 
        w.id === seatId || 
        w.uuid === seatId || 
        w.windowId === seatId
      );
      
      if (window) {
        return { success: true, message: '席位可用' };
      }
      return { success: false, message: '未找到对应窗口，请检查席位ID是否正确' };
    }
    
    return { success: false, message: 'API 连接失败' };
  } catch (error) {
    return { success: false, message: '无法连接到比特浏览器，请确认 API 已开启' };
  }
}

/**
 * 生成随机 ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 18) + 
         Math.random().toString(36).substring(2, 18);
}
