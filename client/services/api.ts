/**
 * API 服务 - 与后端通信
 */

import * as FileSystem from 'expo-file-system/legacy';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL + '/api/v1';

// 重新定义 fetch 类型
const customFetch = globalThis.fetch || ((input: RequestInfo, init?: RequestInit) => {
  return fetch(input as string, init);
});

/**
 * 发送聊天消息
 */
export async function sendMessage(message: string): Promise<{
  success: boolean;
  reply: string;
  intent?: string;
  params?: Record<string, any>;
}> {
  const response = await customFetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 获取聊天历史
 */
export async function getChatHistory(): Promise<{
  success: boolean;
  history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
}> {
  const response = await customFetch(`${API_BASE}/chat/history`);

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 清空聊天历史
 */
export async function clearChatHistory(): Promise<{ success: boolean; message: string }> {
  const response = await customFetch(`${API_BASE}/chat/history`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 检查浏览器连接状态
 */
export async function checkBrowserStatus(): Promise<{
  success: boolean;
  connected: boolean;
  browsers: Array<any>;
  message?: string;
}> {
  const response = await customFetch(`${API_BASE}/browser/status`);

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 获取浏览器列表
 */
export async function getBrowserList(): Promise<{
  success: boolean;
  data?: Array<any>;
  msg?: string;
}> {
  const response = await customFetch(`${API_BASE}/browser/list`);

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 打开大鱼平台
 */
export async function openDayu(browserId: string): Promise<{
  success: boolean;
  msg?: string;
  data?: any;
}> {
  const response = await customFetch(`${API_BASE}/browser/open-dayu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ browserId }),
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 截图
 */
export async function takeScreenshot(browserId: string): Promise<{
  success: boolean;
  data?: string;
  msg?: string;
}> {
  const response = await customFetch(`${API_BASE}/browser/screenshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ browserId }),
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 获取可用操作列表
 */
export async function getBrowserActions(): Promise<{
  success: boolean;
  actions: Array<{
    id: string;
    name: string;
    description: string;
    params: string[];
  }>;
}> {
  const response = await customFetch(`${API_BASE}/browser/actions`);

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  return response.json();
}
