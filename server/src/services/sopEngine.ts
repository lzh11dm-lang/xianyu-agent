/**
 * 闲鱼投流 SOP 引擎
 * 
 * 完整 SOP 流程：
 * 1. 上架 5 条链接 → 开曝光计划（出价 20 元，日预算 40 元）→ 跑 1-2 小时 → 选出 1-2 条优质链接
 * 2. 选出 1-2 条好链接 → 开咨询计划 → 出价 120% 成本出价 → 日预算 50 元/条 → 补单 → 跑 1-2 天
 * 3. 7 天观察期
 *    - 正常情况：正常补单，等消耗
 *    - 出现问题：消耗不出去 → 调整动作1：提成本20% → 还是不行 → 调整动作2：曝光计划养曝光 → 还是不行 → 上新链接赛马
 * 4. 如果点击率/浏览率低 → 换主图/标题 → 重新执行调整流程
 */

export type CampaignType = '曝光' | '咨询';
export type PlanStatus = '投放中' | '已暂停' | '已结束' | '消耗不出去' | '表现良好';
export type AdjustmentAction = '提成本' | '养曝光' | '上新链接' | '换素材' | '继续投放';

export interface Product {
  id: string;
  title: string;
  images: string[];
  price: number;
  status: '待发布' | '已发布' | '暂停' | '已淘汰';
}

export interface Campaign {
  id: string;
  productIds: string[];  // 关联的商品 ID（最多 2 个）
  type: CampaignType;
  bidPrice: number;       // 出价
  dailyBudget: number;    // 日预算
  status: PlanStatus;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  currentCost?: number;    // 当前消耗
  currentConsults?: number; // 当前咨询数
  currentClicks?: number;  // 当前点击数
  currentImpressions?: number; // 当前曝光数
  currentViews?: number;   // 当前浏览数
  clickRate?: number;      // 点击率
  consultCost?: number;    // 单次咨询成本
  adjustmentHistory: AdjustmentRecord[];
}

export interface AdjustmentRecord {
  action: AdjustmentAction;
  reason: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
}

export interface DayuAccount {
  id: string;
  name: string;
  browserId?: string;
  campaigns: Campaign[];
  products: Product[];
  status: '正常' | '异常';
}

export interface SOPContext {
  accountId: string;
  phase: '上架' | '曝光赛马' | '咨询投放' | '观察期' | '调整期' | '淘汰';
  selectedProducts: string[];  // 选出的优质链接
  currentCampaign?: Campaign;
  daysRunning: number;         // 已运行天数
  lastAdjustment?: AdjustmentRecord;
  adjustmentHistory: AdjustmentRecord[]; // 调整历史
}

export interface SOPResult {
  success: boolean;
  message: string;
  action: '上架' | '创建曝光计划' | '创建咨询计划' | '提成本' | '养曝光' | '上新链接' | '换素材' | '继续投放' | '等待';
  data?: any;
  nextStep?: string;
  suggestions?: string[];
}

/**
 * SOP 引擎类
 */
export class SOPEngine {
  private context: SOPContext;

  constructor(accountId: string) {
    this.context = {
      accountId,
      phase: '上架',
      selectedProducts: [],
      daysRunning: 0,
      adjustmentHistory: [],
    };
  }

  /**
   * 获取当前 SOP 阶段
   */
  getPhase(): string {
    return this.context.phase;
  }

  /**
   * 设置选出的优质链接
   */
  setSelectedProducts(productIds: string[]): void {
    this.context.selectedProducts = productIds;
  }

  /**
   * 设置当前计划
   */
  setCurrentCampaign(campaign: Campaign): void {
    this.context.currentCampaign = campaign;
  }

  /**
   * 更新运行天数
   */
  updateDaysRunning(days: number): void {
    this.context.daysRunning = days;
  }

  /**
   * 根据数据判断下一步行动
   */
  evaluate(data: CampaignData): SOPResult {
    const { impressions, views, clicks, consults, cost, dailyBudget } = data;

    // 计算关键指标
    const clickRate = clicks / views;  // 点击率
    const consultCost = consults > 0 ? cost / consults : 0; // 单次咨询成本
    const budgetUsedRate = cost / dailyBudget; // 预算消耗率

    // 判断阶段和下一步行动
    switch (this.context.phase) {
      case '上架':
        return this.handle上架();

      case '曝光赛马':
        return this.handle曝光赛马(data);

      case '咨询投放':
        return this.handle咨询投放(data);

      case '观察期':
        return this.handle观察期(data);

      case '调整期':
        return this.handle调整期(data);

      default:
        return {
          success: true,
          message: '当前阶段未定义',
          action: '等待',
        };
    }
  }

  /**
   * 处理上架阶段
   */
  private handle上架(): SOPResult {
    return {
      success: true,
      message: '已完成上架，开始创建曝光计划',
      action: '创建曝光计划',
      data: {
        type: '曝光',
        bidPrice: 20,
        dailyBudget: 40,
      },
      nextStep: '等待 1-2 小时，观察曝光计划表现，选出优质链接',
    };
  }

  /**
   * 处理曝光赛马阶段
   */
  private handle曝光赛马(data: CampaignData): SOPResult {
    // 判断是否跑出结果
    if (data.consults >= 1) {
      // 有咨询，说明链接质量不错
      return {
        success: true,
        message: '曝光计划已跑出咨询，选出优质链接',
        action: '创建咨询计划',
        data: {
          type: '咨询',
          bidPrice: '120%成本出价（系统推荐）',
          dailyBudget: 50,
          productIds: this.context.selectedProducts.length > 0 
            ? this.context.selectedProducts 
            : ['默认选择前两条'],
        },
        nextStep: '人工补单，等待 1-2 天观察效果',
      };
    }

    return {
      success: true,
      message: '曝光计划仍在跑马中，继续观察',
      action: '等待',
      nextStep: '1-2 小时后再次评估',
    };
  }

  /**
   * 处理咨询投放阶段
   */
  private handle咨询投放(data: CampaignData): SOPResult {
    const consultCost = data.consults > 0 ? data.cost / data.consults : Infinity;

    // 判断是否消耗不出去
    const budgetUsedRate = data.budgetUsedRate ?? 0;
    const clickRate = data.clickRate ?? 0;
    
    if (budgetUsedRate < 0.3) {
      // 消耗率低于 30%，可能消耗不出去
      return {
        success: true,
        message: '咨询计划消耗不出去，进入调整期',
        action: '提成本',
        data: {
          action: '提成本',
          reason: `消耗率仅 ${(budgetUsedRate * 100).toFixed(1)}%，低于 30%`,
          suggestion: '建议提高出价 20%',
        },
        nextStep: '提高出价 20%，继续观察 1 天',
      };
    }

    // 判断是否表现良好
    if (budgetUsedRate > 0.5 && consultCost < 100) {
      return {
        success: true,
        message: '咨询计划表现良好，继续投放',
        action: '继续投放',
        suggestions: [
          '预算消耗正常',
          `当前咨询成本 ${consultCost.toFixed(2)} 元`,
          '保持当前设置，继续观察',
        ],
      };
    }

    // 7 天观察期
    if (this.context.daysRunning >= 7) {
      return {
        success: true,
        message: '已运行 7 天，进行全面复盘',
        action: '提成本',
        nextStep: '根据数据决定下一步',
      };
    }

    return {
      success: true,
      message: '咨询计划正常运行中',
      action: '继续投放',
      nextStep: '继续观察数据',
    };
  }

  /**
   * 处理观察期
   */
  private handle观察期(data: CampaignData): SOPResult {
    const clickRate = data.clickRate ?? 0;
    
    // 点击率过低
    if (clickRate < 0.05) {
      return {
        success: true,
        message: '点击率过低，考虑优化素材',
        action: '换素材',
        data: {
          reason: `点击率 ${(clickRate * 100).toFixed(2)}%，低于 5%`,
          suggestion: '建议更换主图或标题',
        },
        suggestions: [
          '检查商品主图是否吸引人',
          '优化商品标题关键词',
          '对比同行优秀商品',
        ],
      };
    }

    return {
      success: true,
      message: '观察期内数据正常',
      action: '继续投放',
      nextStep: '继续观察',
    };
  }

  /**
   * 处理调整期
   */
  private handle调整期(data: CampaignData): SOPResult {
    const previousAction = this.context.lastAdjustment?.action;

    if (previousAction === '提成本') {
      // 已提成本，再次检查
      const budgetUsedRate = data.budgetUsedRate ?? 0;
      if (budgetUsedRate < 0.5) {
        // 仍然消耗不好
        return {
          success: true,
          message: '提成本后仍消耗不好，尝试养曝光',
          action: '养曝光',
          data: {
            action: '养曝光',
            reason: '提成本后消耗率仍低于 50%',
            suggestion: '停咨询计划，改开曝光计划，日预算 15 元',
          },
          nextStep: '曝光计划养 2-3 天，再重新开咨询计划',
        };
      }
    }

    if (previousAction === '养曝光') {
      // 养完曝光后重新开咨询
      return {
        success: true,
        message: '养曝光完成，重新开咨询计划',
        action: '创建咨询计划',
        data: {
          type: '咨询',
          bidPrice: '原出价',
          dailyBudget: 50,
        },
        nextStep: '观察 1-2 天',
      };
    }

    // 多次调整都无效
    const adjustmentCount = this.context.adjustmentHistory.filter(
      h => h.action === '提成本' || h.action === '养曝光'
    ).length;

    if (adjustmentCount >= 4) {
      return {
        success: true,
        message: '多次调整无效，建议淘汰该链接，上新链接继续赛马',
        action: '上新链接',
        suggestions: [
          '当前链接表现持续不佳',
          '建议上新链接重新开始赛马',
          '保持当前优质链接，继续测新品',
        ],
      };
    }

    return {
      success: true,
      message: '继续调整中',
      action: '提成本',
      nextStep: '建议提高出价 20%',
    };
  }

  /**
   * 执行调整动作
   */
  executeAdjustment(action: AdjustmentAction, data?: any): SOPResult {
    // 记录调整历史
    this.context.adjustmentHistory.push({
      action,
      reason: data?.reason || '',
      previousValue: data?.previousValue,
      newValue: data?.newValue,
      timestamp: new Date().toISOString(),
    });

    this.context.lastAdjustment = this.context.adjustmentHistory[
      this.context.adjustmentHistory.length - 1
    ];

    switch (action) {
      case '提成本':
        this.context.phase = '调整期';
        return {
          success: true,
          message: '已执行：提高出价 20%',
          action: '提成本',
          nextStep: '等待 1 天观察效果',
        };

      case '养曝光':
        this.context.phase = '调整期';
        return {
          success: true,
          message: '已执行：停咨询计划，开曝光计划养曝光',
          action: '养曝光',
          nextStep: '曝光计划日预算 15 元，跑 2-3 天后再重新开咨询',
        };

      case '换素材':
        return {
          success: true,
          message: '已记录：更换主图/标题',
          action: '换素材',
          nextStep: '更换后继续观察数据',
        };

      case '上新链接':
        // 重置上下文，开始新的赛马
        this.context.phase = '上架';
        this.context.selectedProducts = [];
        this.context.daysRunning = 0;
        this.context.adjustmentHistory = [];
        return {
          success: true,
          message: '已执行：上新链接，开始新的赛马流程',
          action: '上新链接',
          nextStep: '上架 5 条新链接，创建曝光计划',
        };

      default:
        return {
          success: false,
          message: '未知调整动作',
          action: '等待',
        };
    }
  }

  /**
   * 推进到下一阶段
   */
  advancePhase(phase: SOPContext['phase']): void {
    this.context.phase = phase;
  }

  /**
   * 获取完整的 SOP 状态
   */
  getStatus(): SOPContext {
    return { ...this.context };
  }

  /**
   * 导出 SOP 报告
   */
  generateReport(): SOPReport {
    return {
      accountId: this.context.accountId,
      currentPhase: this.context.phase,
      selectedProducts: this.context.selectedProducts,
      daysRunning: this.context.daysRunning,
      adjustmentHistory: this.context.adjustmentHistory,
      summary: this.generateSummary(),
    };
  }

  private generateSummary(): string {
    const phaseNames: Record<string, string> = {
      '上架': '准备上架新链接',
      '曝光赛马': '曝光计划赛马中',
      '咨询投放': '咨询计划投放中',
      '观察期': '7天观察期内',
      '调整期': '调整优化中',
      '淘汰': '链接已淘汰',
    };

    return `当前账号 ${this.context.accountId} 处于「${phaseNames[this.context.phase]}」阶段，已运行 ${this.context.daysRunning} 天`;
  }
}

export interface CampaignData {
  impressions: number;  // 曝光数
  views: number;         // 浏览数
  clicks: number;        // 点击数
  consults: number;      // 咨询数
  cost: number;          // 消耗金额
  dailyBudget: number;   // 日预算
  clickRate?: number;    // 点击率
  consultCost?: number;  // 单次咨询成本
  budgetUsedRate?: number; // 预算消耗率
}

export interface SOPReport {
  accountId: string;
  currentPhase: string;
  selectedProducts: string[];
  daysRunning: number;
  adjustmentHistory: AdjustmentRecord[];
  summary: string;
}
