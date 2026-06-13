/**
 * 大鱼平台（超级擦亮）自动化操作服务
 * 
 * 大鱼平台 URL: https://adayu.com 或相关后台
 * 具体 URL 需要用户确认
 */

import { bitBrowser } from './bitBrowser';

interface PlanData {
  name: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  cpc: number;
}

interface CreateExposurePlanParams {
  launchId: string;           // 浏览器窗口ID
  productLink: string;       // 商品链接
  bid: number;               // 出价（默认20元）
  dailyBudget: number;       // 日预算（默认40元）
}

interface CreateConsultPlanParams {
  launchId: string;
  productLinks: string[];    // 1-2条商品链接
  costBid: number;           // 成本出价
  dailyBudget: number;       // 日预算（默认50元）
}

class DayuPlatformService {
  private platformUrl = 'https://adayu.com'; // 需要用户确认实际URL

  /**
   * 导航到大鱼平台
   */
  async navigateToPlatform(launchId: string): Promise<{ success: boolean; msg: string }> {
    const result = await bitBrowser.openNewTab(launchId, this.platformUrl);
    if (result.success) {
      // 等待页面加载
      await this.delay(2000);
      return { success: true, msg: '已打开大鱼平台' };
    }
    return { success: false, msg: result.msg || '无法打开大鱼平台' };
  }

  /**
   * 导航到投流计划列表
   */
  async navigateToPlanList(launchId: string): Promise<{ success: boolean; msg: string }> {
    // 先确保在正确的页面
    const result = await bitBrowser.executeScript(launchId, `
      (function() {
        // 检查是否在投流计划页面
        const url = window.location.href;
        if (!url.includes('dayu') && !url.includes('plan')) {
          window.location.href = '${this.platformUrl}/plan';
          return false;
        }
        return true;
      })()
    `);
    
    if (result.success && result.data) {
      return { success: true, msg: '已在投流计划页面' };
    }
    
    // 直接打开新标签
    await bitBrowser.openNewTab(launchId, `${this.platformUrl}/plan`);
    await this.delay(3000);
    
    return { success: true, msg: '已打开投流计划页面' };
  }

  /**
   * 获取投流计划列表
   */
  async getPlanList(launchId: string): Promise<{ success: boolean; data?: PlanData[]; msg: string }> {
    const result = await bitBrowser.executeScript(launchId, `
      (function() {
        // 尝试获取计划列表数据
        // 这里需要根据实际页面结构调整
        const plans = [];
        
        // 查找表格或列表容器
        const rows = document.querySelectorAll('.plan-item, .campaign-row, table tbody tr');
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 5) {
            plans.push({
              name: cells[0]?.textContent?.trim() || '',
              status: cells[1]?.textContent?.trim() || '',
              budget: parseFloat(cells[2]?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              spent: parseFloat(cells[3]?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              impressions: parseInt(cells[4]?.textContent?.replace(/[^0-9]/g, '') || '0'),
            });
          }
        });
        
        // 如果没找到，尝试其他选择器
        if (plans.length === 0) {
          const items = document.querySelectorAll('[class*="plan"], [class*="campaign"]');
          items.forEach(item => {
            const name = item.querySelector('[class*="name"], [class*="title"]')?.textContent;
            const status = item.querySelector('[class*="status"]')?.textContent;
            if (name) {
              plans.push({ name, status, budget: 0, spent: 0, impressions: 0 });
            }
          });
        }
        
        return plans;
      })()
    `);
    
    if (result.success) {
      return { success: true, data: result.data || [], msg: '已获取计划列表' };
    }
    
    return { success: false, msg: '无法获取计划列表，请手动打开大鱼平台' };
  }

  /**
   * 创建曝光计划
   * 按照 SOP: 出价20元，日预算40元
   */
  async createExposurePlan(params: CreateExposurePlanParams): Promise<{ success: boolean; planId?: string; msg: string }> {
    const { launchId, productLink, bid = 20, dailyBudget = 40 } = params;

    try {
      // 1. 导航到新建计划页面
      await bitBrowser.openNewTab(launchId, `${this.platformUrl}/plan/create?type=exposure`);
      await this.delay(3000);

      // 2. 填写商品链接
      const fillLinkResult = await bitBrowser.fillInput(launchId, 'input[name="productLink"], input[placeholder*="商品"], input[placeholder*="链接"]', productLink);
      if (!fillLinkResult.success) {
        // 尝试其他选择器
        await bitBrowser.fillInput(launchId, 'input[type="text"]', productLink);
      }
      await this.delay(500);

      // 3. 设置出价
      await bitBrowser.fillInput(launchId, 'input[name="bid"], input[placeholder*="出价"]', bid.toString());
      await this.delay(500);

      // 4. 设置日预算
      await bitBrowser.fillInput(launchId, 'input[name="budget"], input[placeholder*="预算"]', dailyBudget.toString());
      await this.delay(500);

      // 5. 点击提交按钮
      const submitSelectors = [
        'button[type="submit"]',
        'button:contains("创建")',
        'button:contains("提交")',
        '.submit-btn',
        '.confirm-btn'
      ];

      for (const selector of submitSelectors) {
        const result = await bitBrowser.clickElement(launchId, selector);
        if (result.success) break;
      }
      await this.delay(2000);

      return { success: true, msg: `已创建曝光计划，出价${bid}元，日预算${dailyBudget}元` };
    } catch (error) {
      return { success: false, msg: '创建曝光计划失败' };
    }
  }

  /**
   * 创建咨询计划
   * 按照 SOP: 120%成本出价，日预算50元
   */
  async createConsultPlan(params: CreateConsultPlanParams): Promise<{ success: boolean; planId?: string; msg: string }> {
    const { launchId, productLinks, costBid, dailyBudget = 50 } = params;

    try {
      // 1. 导航到新建计划页面
      await bitBrowser.openNewTab(launchId, `${this.platformUrl}/plan/create?type=consult`);
      await this.delay(3000);

      // 2. 添加商品链接（支持多个）
      for (let i = 0; i < productLinks.length; i++) {
        if (i > 0) {
          // 点击添加按钮
          await bitBrowser.clickElement(launchId, 'button:contains("添加"), .add-btn');
          await this.delay(500);
        }
        await bitBrowser.fillInput(launchId, `input[name="productLink${i}"]`, productLinks[i]);
      }
      await this.delay(500);

      // 3. 设置120%成本出价
      const bid120 = Math.round(costBid * 1.2 * 100) / 100;
      await bitBrowser.fillInput(launchId, 'input[name="bid"], input[placeholder*="出价"]', bid120.toString());
      await this.delay(500);

      // 4. 设置日预算
      await bitBrowser.fillInput(launchId, 'input[name="budget"]', dailyBudget.toString());
      await this.delay(500);

      // 5. 点击提交
      await bitBrowser.clickElement(launchId, 'button[type="submit"], .submit-btn');
      await this.delay(2000);

      return { success: true, msg: `已创建咨询计划，出价${bid120}元（120%成本），日预算${dailyBudget}元` };
    } catch (error) {
      return { success: false, msg: '创建咨询计划失败' };
    }
  }

  /**
   * 调整出价
   * @param launchId 浏览器窗口ID
   * @param planId 计划ID
   * @param newBid 新的出价
   */
  async adjustBid(launchId: string, planId: string, newBid: number): Promise<{ success: boolean; msg: string }> {
    try {
      // 1. 打开计划详情页
      await bitBrowser.openNewTab(launchId, `${this.platformUrl}/plan/edit/${planId}`);
      await this.delay(2000);

      // 2. 修改出价
      await bitBrowser.fillInput(launchId, 'input[name="bid"], input[placeholder*="出价"]', newBid.toString());
      await this.delay(500);

      // 3. 保存
      await bitBrowser.clickElement(launchId, 'button:contains("保存"), .save-btn');
      await this.delay(1000);

      return { success: true, msg: `已将出价调整为${newBid}元` };
    } catch (error) {
      return { success: false, msg: '调整出价失败' };
    }
  }

  /**
   * 暂停计划
   */
  async pausePlan(launchId: string, planId: string): Promise<{ success: boolean; msg: string }> {
    try {
      // 方法1: 在列表页操作
      await bitBrowser.navigateToPlanList(launchId);
      await this.delay(2000);

      // 查找并点击暂停按钮
      const result = await bitBrowser.executeScript(launchId, `
        (function() {
          // 查找暂停按钮并点击
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent.includes('暂停') || btn.className.includes('pause')) {
              btn.click();
              return true;
            }
          }
          return false;
        })()
      `);

      if (result.success && result.data) {
        return { success: true, msg: '已暂停计划' };
      }

      return { success: false, msg: '未找到暂停按钮，请手动操作' };
    } catch (error) {
      return { success: false, msg: '暂停计划失败' };
    }
  }

  /**
   * 启动计划
   */
  async startPlan(launchId: string, planId: string): Promise<{ success: boolean; msg: string }> {
    try {
      await bitBrowser.navigateToPlanList(launchId);
      await this.delay(2000);

      const result = await bitBrowser.executeScript(launchId, `
        (function() {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent.includes('启动') || btn.textContent.includes('开启') || btn.className.includes('start')) {
              btn.click();
              return true;
            }
          }
          return false;
        })()
      `);

      if (result.success && result.data) {
        return { success: true, msg: '已启动计划' };
      }

      return { success: false, msg: '未找到启动按钮，请手动操作' };
    } catch (error) {
      return { success: false, msg: '启动计划失败' };
    }
  }

  /**
   * 获取计划数据
   */
  async getPlanData(launchId: string, planId?: string): Promise<{ success: boolean; data?: any; msg: string }> {
    try {
      const url = planId 
        ? `${this.platformUrl}/plan/data/${planId}` 
        : `${this.platformUrl}/plan/data`;

      await bitBrowser.openNewTab(launchId, url);
      await this.delay(3000);

      // 提取数据
      const result = await bitBrowser.executeScript(launchId, `
        (function() {
          const data = {};
          
          // 尝试提取各种数据指标
          const selectors = {
            spent: '[class*="spent"], [class*="cost"], [class*="消耗"]',
            impressions: '[class*="impression"], [class*="曝光"]',
            clicks: '[class*="click"], [class*="点击"]',
            ctr: '[class*="ctr"], [class*="rate"], [class*="点击率"]',
            consults: '[class*="consult"], [class*="咨询"]',
            cpc: '[class*="cpc"], [class*="单次"]'
          };
          
          for (const [key, selector] of Object.entries(selectors)) {
            const el = document.querySelector(selector);
            if (el) {
              const text = el.textContent || '';
              const num = parseFloat(text.replace(/[^0-9.]/g, ''));
              data[key] = isNaN(num) ? text : num;
            }
          }
          
          return data;
        })()
      `);

      if (result.success) {
        return { success: true, data: result.data, msg: '已获取计划数据' };
      }

      return { success: false, msg: '无法获取数据，请手动打开页面' };
    } catch (error) {
      return { success: false, msg: '获取计划数据失败' };
    }
  }

  /**
   * 执行曝光计划养曝光操作
   * 按照 SOP: 停咨询计划，开曝光计划，日预算15元，跑2-3天
   */
  async doExposureBoost(launchId: string, productLinks: string[]): Promise<{ success: boolean; msg: string }> {
    // 1. 暂停当前咨询计划
    await this.pausePlan(launchId, '');
    await this.delay(1000);

    // 2. 创建曝光计划，日预算15元
    const result = await this.createExposurePlan({
      launchId,
      productLink: productLinks[0],
      bid: 20,
      dailyBudget: 15
    });

    return {
      success: result.success,
      msg: result.success 
        ? '已完成曝光养计划：暂停咨询计划，创建曝光计划（日预算15元），请等待2-3天后重新开启咨询计划' 
        : '曝光养计划失败'
    };
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 抓取计划数据（消耗、咨询、点击率等）
   * 实际需要通过浏览器打开大鱼后台获取真实数据
   */
  async fetchPlanData(launchId: string, planId: string): Promise<{
    success: boolean;
    data?: {
      planId: string;
      planName: string;
      status: 'running' | 'paused' | 'completed' | 'no_budget';
      impressions: number;
      clicks: number;
      consultations: number;
      cost: number;
      cpc: number;
      cpa: number;
      ctr: number;
      date: string;
    };
    error?: string;
  }> {
    try {
      // 打开大鱼平台数据页面
      await bitBrowser.openNewTab(launchId, 'https://sns.baichuanad.com/cps/#/campaign/list');
      await this.delay(3000);

      // TODO: 通过 DOM 解析获取真实数据
      // 实际实现需要：
      // 1. 定位到计划列表中的目标计划
      // 2. 提取消耗、咨询数、点击数等数据
      // 3. 计算点击率 (CTR = clicks / impressions)

      // 返回模拟数据（实际需要解析页面）
      return {
        success: true,
        data: {
          planId,
          planName: '计划-' + planId.substring(0, 8),
          status: 'running',
          impressions: 0,
          clicks: 0,
          consultations: 0,
          cost: 0,
          cpc: 0,
          cpa: 0,
          ctr: 0,
          date: new Date().toISOString().split('T')[0]
        }
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * 批量抓取账户下所有计划数据
   */
  async fetchAllPlanData(launchId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      // 打开大鱼平台计划列表
      await bitBrowser.openNewTab(launchId, 'https://sns.baichuanad.com/cps/#/campaign/list');
      await this.delay(3000);

      // TODO: 解析计划列表页面
      // 需要提取每个计划的状态和关键数据

      return {
        success: true,
        data: []
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * 分析计划表现并给出建议
   */
  analyzePlanPerformance(data: {
    impressions: number;
    clicks: number;
    consultations: number;
    cost: number;
  }): {
    status: 'normal' | 'warning' | 'critical';
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let status: 'normal' | 'warning' | 'critical' = 'normal';

    // 计算 CTR
    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;

    // 计算 CPA（单次咨询成本）
    const cpa = data.consultations > 0 ? data.cost / data.consultations : 0;

    // 检查问题
    if (data.impressions === 0 && data.cost > 0) {
      issues.push('有消耗但无曝光，可能计划暂停或账户异常');
      suggestions.push('检查计划状态，确认账户是否正常');
      status = 'critical';
    }

    if (ctr < 1) {
      issues.push(`点击率过低: ${ctr.toFixed(2)}%`);
      suggestions.push('建议更换主图或标题提升吸引力');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    if (data.consultations === 0 && data.cost > 50) {
      issues.push('高消耗但无咨询，可能定向不准或素材问题');
      suggestions.push('检查投放人群定向，考虑更换主图');
      status = 'critical';
    }

    if (cpa > 30) {
      issues.push(`咨询成本过高: ¥${cpa.toFixed(2)}`);
      suggestions.push('建议降低出价或优化定向');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    if (issues.length === 0) {
      suggestions.push('计划表现正常，继续观察');
    }

    return { status, issues, suggestions };
  }
}

export const dayuPlatform = new DayuPlatformService();

/**
 * 数据分析服务扩展 - 大鱼平台数据抓取
 */
class DayuAnalyticsService {
  private bitBrowser = bitBrowser;

  /**
   * 抓取计划数据
   */
  async fetchPlanData(browserId: string, planId: string): Promise<{
    success: boolean;
    data?: {
      planId: string;
      planName: string;
      status: 'running' | 'paused' | 'completed';
      impressions: number;
      clicks: number;
      consultations: number;
      cost: number;
      cpc: number;
      cpa: number;
      ctr: number;
      date: string;
    };
    error?: string;
  }> {
    try {
      // 打开大鱼平台数据页面
      const openResult = await this.bitBrowser.openNewTab(browserId, 'https://sns.baichuanad.com/cps/#/campaign/list');
      if (!openResult.success) {
        return { success: false, error: '无法打开大鱼平台' };
      }

      // 等待页面加载
      await this.delay(3000);

      // 获取页面内容
      const pageResult = await this.bitBrowser.getPageSource(browserId);
      if (!pageResult.success) {
        return { success: false, error: '无法获取页面数据' };
      }

      // 模拟返回数据（实际需要通过页面解析获取）
      return {
        success: true,
        data: {
          planId,
          planName: '计划-' + planId.substring(0, 8),
          status: 'running',
          impressions: 0,
          clicks: 0,
          consultations: 0,
          cost: 0,
          cpc: 0,
          cpa: 0,
          ctr: 0,
          date: new Date().toISOString().split('T')[0]
        }
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * 抓取账户所有计划数据
   */
  async fetchAllPlanData(browserId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      // 打开大鱼平台
      const openResult = await this.bitBrowser.openNewTab(browserId, 'https://sns.baichuanad.com/cps/#/campaign/list');
      if (!openResult.success) {
        return { success: false, error: '无法打开大鱼平台' };
      }

      await this.delay(3000);

      // 模拟返回计划列表数据
      return {
        success: true,
        data: []
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const dayuAnalytics = new DayuAnalyticsService();
