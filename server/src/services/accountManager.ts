/**
 * 账号管理服务
 * 
 * 功能：
 * 1. 管理多个闲鱼账号
 * 2. 为每个账号维护独立的 SOP 上下文
 * 3. 支持并行操作多个账号
 */

import { SOPEngine } from './sopEngine';
import { bitBrowser } from './bitBrowser';

export interface Account {
  id: string;                    // 账号唯一标识（如 'account-1'）
  name: string;                  // 账号名称（如 '账号1'）
  browserId?: string;            // 关联的比特浏览器窗口 ID
  status: '离线' | '在线' | '忙碌' | '异常';
  createdAt: string;
  lastActiveAt?: string;
  notes?: string;                // 备注（如绑定的闲鱼昵称）
}

export interface AccountContext {
  accountId: string;
  sopEngine: SOPEngine;
  currentCampaignId?: string;
  dataHistory: Array<{
    date: string;
    metrics: {
      impressions: number;
      views: number;
      clicks: number;
      consults: number;
      cost: number;
    };
  }>;
}

/**
 * 账号管理器
 */
class AccountManager {
  private accounts: Map<string, Account> = new Map();
  private contexts: Map<string, AccountContext> = new Map();
  private maxAccounts = 4;  // 最多支持 4 个账号

  constructor() {
    // 初始化默认账号
    this.initializeDefaultAccounts();
  }

  /**
   * 初始化默认账号
   */
  private initializeDefaultAccounts() {
    for (let i = 1; i <= this.maxAccounts; i++) {
      const id = `account-${i}`;
      const name = `账号${i}`;
      this.accounts.set(id, {
        id,
        name,
        status: '离线',
        createdAt: new Date().toISOString(),
      });
      this.contexts.set(id, {
        accountId: id,
        sopEngine: new SOPEngine(id),
        dataHistory: [],
      });
    }
  }

  /**
   * 获取所有账号
   */
  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  /**
   * 获取单个账号
   */
  getAccount(accountId: string): Account | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * 获取账号上下文
   */
  getContext(accountId: string): AccountContext | undefined {
    return this.contexts.get(accountId);
  }

  /**
   * 更新账号信息
   */
  updateAccount(accountId: string, updates: Partial<Account>): Account | undefined {
    const account = this.accounts.get(accountId);
    if (!account) return undefined;

    const updated = {
      ...account,
      ...updates,
      lastActiveAt: new Date().toISOString(),
    };
    this.accounts.set(accountId, updated);
    return updated;
  }

  /**
   * 绑定浏览器窗口
   */
  async bindBrowser(accountId: string, browserId: string): Promise<boolean> {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    // 验证浏览器是否存在
    const result = await bitBrowser.listBrowsers();
    if (!result.success) return false;

    const browser = result.data?.find((b) => b.id === browserId);
    if (!browser) return false;

    // 更新账号
    this.updateAccount(accountId, {
      browserId,
      status: '在线',
    });

    return true;
  }

  /**
   * 解绑浏览器窗口
   */
  unbindBrowser(accountId: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    this.updateAccount(accountId, {
      browserId: undefined,
      status: '离线',
    });

    return true;
  }

  /**
   * 获取账号的 SOP 引擎
   */
  getSOPEngine(accountId: string): SOPEngine | undefined {
    const context = this.contexts.get(accountId);
    return context?.sopEngine;
  }

  /**
   * 添加数据历史
   */
  addDataHistory(
    accountId: string,
    data: {
      impressions: number;
      views: number;
      clicks: number;
      consults: number;
      cost: number;
    }
  ): boolean {
    const context = this.contexts.get(accountId);
    if (!context) return false;

    context.dataHistory.push({
      date: new Date().toISOString().split('T')[0],
      metrics: data,
    });

    // 保留最近 30 天的数据
    if (context.dataHistory.length > 30) {
      context.dataHistory = context.dataHistory.slice(-30);
    }

    return true;
  }

  /**
   * 获取历史数据
   */
  getDataHistory(accountId: string, days: number = 7): Array<{
    date: string;
    metrics: {
      impressions: number;
      views: number;
      clicks: number;
      consults: number;
      cost: number;
    };
  }> {
    const context = this.contexts.get(accountId);
    if (!context) return [];

    return context.dataHistory.slice(-days);
  }

  /**
   * 获取昨日数据
   */
  getYesterdayData(accountId: string): {
    impressions: number;
    views: number;
    clicks: number;
    consults: number;
    cost: number;
  } | null {
    const history = this.getDataHistory(accountId, 2);
    const yesterday = history.find((h) => {
      const today = new Date().toISOString().split('T')[0];
      return h.date !== today;
    });
    return yesterday?.metrics || null;
  }

  /**
   * 获取所有账号的汇总状态
   */
  getSummary(): {
    totalAccounts: number;
    onlineAccounts: number;
    offlineAccounts: number;
    accounts: Array<{
      id: string;
      name: string;
      status: string;
      browserId?: string;
      sopPhase: string;
    }>;
  } {
    const accounts = this.getAllAccounts();
    const online = accounts.filter((a) => a.status === '在线').length;

    return {
      totalAccounts: accounts.length,
      onlineAccounts: online,
      offlineAccounts: accounts.length - online,
      accounts: accounts.map((a) => {
        const sop = this.getSOPEngine(a.id);
        return {
          id: a.id,
          name: a.name,
          status: a.status,
          browserId: a.browserId,
          sopPhase: sop?.getPhase() || '未知',
        };
      }),
    };
  }

  /**
   * 执行批量操作
   */
  async batchOperation<T>(
    accountIds: string[],
    operation: (accountId: string) => Promise<T>
  ): Promise<Map<string, { success: boolean; data?: T; error?: string }>> {
    const results = new Map<string, { success: boolean; data?: T; error?: string }>();

    // 并行执行
    const promises = accountIds.map(async (accountId) => {
      try {
        const data = await operation(accountId);
        return { accountId, success: true, data };
      } catch (error: any) {
        return { accountId, success: false, error: error.message };
      }
    });

    const settled = await Promise.all(promises);
    settled.forEach((result) => {
      results.set(result.accountId, result);
    });

    return results;
  }

  /**
   * 重置账号（清空 SOP 状态）
   */
  resetAccount(accountId: string): boolean {
    const context = this.contexts.get(accountId);
    if (!context) return false;

    context.sopEngine = new SOPEngine(accountId);
    context.currentCampaignId = undefined;
    context.dataHistory = [];

    return true;
  }
}

// 单例导出
export const accountManager = new AccountManager();
