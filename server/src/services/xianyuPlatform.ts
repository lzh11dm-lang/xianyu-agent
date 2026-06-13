/**
 * 闲鱼平台自动化操作服务
 * 
 * 闲鱼平台 URL: https://www.xianyuma.com
 */

import { bitBrowser } from './bitBrowser';

interface ProductInfo {
  title: string;
  description: string;
  price: number;
  category?: string;
  images?: string[];
}

interface PublishProductParams {
  launchId: string;
  productInfo: ProductInfo;
}

class XianyuPlatformService {
  private platformUrl = 'https://www.xianyuma.com';

  /**
   * 导航到闲鱼发布页面
   */
  async navigateToPublish(launchId: string): Promise<{ success: boolean; msg: string }> {
    await bitBrowser.openNewTab(launchId, `${this.platformUrl}/publish`);
    await this.delay(3000);
    return { success: true, msg: '已打开发布页面' };
  }

  /**
   * 发布商品
   */
  async publishProduct(params: PublishProductParams): Promise<{ success: boolean; productId?: string; msg: string }> {
    const { launchId, productInfo } = params;
    const { title, description, price, category, images } = productInfo;

    try {
      // 1. 导航到发布页面
      await this.navigateToPublish(launchId);

      // 2. 上传图片
      if (images && images.length > 0) {
        // 查找图片上传按钮
        const uploadResult = await bitBrowser.executeScript(launchId, `
          (function() {
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
              // 设置文件数据（需要通过文件上传API）
              return { success: true, hasFileInput: true };
            }
            return { success: false };
          })()
        `);
        
        if (!uploadResult.success) {
          return { success: false, msg: '未找到图片上传入口，请手动上传图片' };
        }
        
        // 注意：图片上传需要通过比特浏览器的文件上传API
        // 这里需要先上传到临时存储，然后设置到input
        await this.delay(1000);
      }

      // 3. 填写标题
      await bitBrowser.fillInput(launchId, 'input[name="title"], input[placeholder*="标题"]', title);
      await this.delay(500);

      // 4. 填写描述
      await bitBrowser.fillInput(launchId, 'textarea[name="description"], textarea[placeholder*="描述"], .description-input', description);
      await this.delay(500);

      // 5. 填写价格
      await bitBrowser.fillInput(launchId, 'input[name="price"], input[placeholder*="价格"]', price.toString());
      await this.delay(500);

      // 6. 选择分类
      if (category) {
        await bitBrowser.clickElement(launchId, '[class*="category"], [class*="分类"]');
        await this.delay(500);
        await bitBrowser.fillInput(launchId, 'input[placeholder*="搜索分类"], .category-search', category);
        await this.delay(500);
      }

      // 7. 点击发布按钮
      const submitResult = await bitBrowser.executeScript(launchId, `
        (function() {
          const buttons = document.querySelectorAll('button, a');
          for (const btn of buttons) {
            const text = btn.textContent?.trim() || '';
            if (text.includes('发布') || text.includes('上架') || text.includes('确认')) {
              btn.click();
              return true;
            }
          }
          return false;
        })()
      `);

      if (submitResult.success) {
        await this.delay(2000);
        return { success: true, msg: `已发布商品：${title}，价格${price}元` };
      }

      return { success: false, msg: '未找到发布按钮，请手动发布' };
    } catch (error) {
      return { success: false, msg: '发布商品失败' };
    }
  }

  /**
   * 获取在售商品列表
   */
  async getProductList(launchId: string): Promise<{ success: boolean; data?: any[]; msg: string }> {
    try {
      await bitBrowser.openNewTab(launchId, `${this.platformUrl}/product/list`);
      await this.delay(3000);

      const result = await bitBrowser.executeScript(launchId, `
        (function() {
          const products = [];
          
          // 尝试多种选择器
          const items = document.querySelectorAll('.product-item, .goods-item, [class*="product"], [class*="item"]');
          
          items.forEach(item => {
            const title = item.querySelector('[class*="title"], [class*="name"]')?.textContent?.trim();
            const price = item.querySelector('[class*="price"]')?.textContent;
            const status = item.querySelector('[class*="status"]')?.textContent;
            
            if (title) {
              products.push({
                title,
                price: price ? parseFloat(price.replace(/[^0-9.]/g, '')) : 0,
                status: status || '在售'
              });
            }
          });
          
          return products;
        })()
      `);

      if (result.success) {
        return { success: true, data: result.data || [], msg: '已获取商品列表' };
      }

      return { success: false, msg: '无法获取商品列表' };
    } catch (error) {
      return { success: false, msg: '获取商品列表失败' };
    }
  }

  /**
   * 下架商品
   */
  async unpublishProduct(launchId: string, productId: string): Promise<{ success: boolean; msg: string }> {
    try {
      await bitBrowser.openNewTab(launchId, `${this.platformUrl}/product/edit/${productId}`);
      await this.delay(2000);

      const result = await bitBrowser.executeScript(launchId, `
        (function() {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            const text = btn.textContent?.trim() || '';
            if (text.includes('下架') || text.includes('删除') || text.includes('取消')) {
              btn.click();
              return true;
            }
          }
          return false;
        })()
      `);

      if (result.success) {
        return { success: true, msg: '已下架商品' };
      }

      return { success: false, msg: '未找到下架按钮' };
    } catch (error) {
      return { success: false, msg: '下架商品失败' };
    }
  }

  /**
   * 修改价格
   */
  async updatePrice(launchId: string, productId: string, newPrice: number): Promise<{ success: boolean; msg: string }> {
    try {
      await bitBrowser.openNewTab(launchId, `${this.platformUrl}/product/edit/${productId}`);
      await this.delay(2000);

      // 清空原价，输入新价格
      await bitBrowser.executeScript(launchId, `
        (function() {
          const priceInput = document.querySelector('input[name="price"], input[placeholder*="价格"]');
          if (priceInput) {
            priceInput.value = '';
            priceInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `);
      await this.delay(300);

      await bitBrowser.fillInput(launchId, 'input[name="price"]', newPrice.toString());
      await this.delay(500);

      // 保存
      const result = await bitBrowser.executeScript(launchId, `
        (function() {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent?.includes('保存') || btn.textContent?.includes('确认')) {
              btn.click();
              return true;
            }
          }
          return false;
        })()
      `);

      if (result.success) {
        return { success: true, msg: `已将价格修改为${newPrice}元` };
      }

      return { success: false, msg: '修改价格失败' };
    } catch (error) {
      return { success: false, msg: '修改价格失败' };
    }
  }

  /**
   * 批量修改价格
   */
  async batchUpdatePrice(launchId: string, priceChange: number): Promise<{ success: boolean; updated: number; msg: string }> {
    try {
      const listResult = await this.getProductList(launchId);
      if (!listResult.success || !listResult.data) {
        return { success: false, updated: 0, msg: '无法获取商品列表' };
      }

      let updated = 0;
      for (const product of listResult.data) {
        const newPrice = product.price + priceChange;
        if (newPrice > 0) {
          await this.updatePrice(launchId, product.id || '', newPrice);
          updated++;
          await this.delay(1000);
        }
      }

      return { success: true, updated, msg: `已更新${updated}个商品价格` };
    } catch (error) {
      return { success: false, updated: 0, msg: '批量修改价格失败' };
    }
  }

  /**
   * 获取订单列表
   */
  async getOrderList(launchId: string): Promise<{ success: boolean; data?: any[]; msg: string }> {
    try {
      await bitBrowser.openNewTab(launchId, `${this.platformUrl}/order/list`);
      await this.delay(3000);

      const result = await bitBrowser.executeScript(launchId, `
        (function() {
          const orders = [];
          const items = document.querySelectorAll('.order-item, [class*="order"]');
          
          items.forEach(item => {
            const orderId = item.querySelector('[class*="order-id"], [class*="id"]')?.textContent;
            const product = item.querySelector('[class*="product"], [class*="title"]')?.textContent;
            const amount = item.querySelector('[class*="amount"], [class*="price"]')?.textContent;
            const status = item.querySelector('[class*="status"]')?.textContent;
            
            if (orderId || product) {
              orders.push({
                orderId,
                product,
                amount: amount ? parseFloat(amount.replace(/[^0-9.]/g, '')) : 0,
                status
              });
            }
          });
          
          return orders;
        })()
      `);

      if (result.success) {
        return { success: true, data: result.data || [], msg: '已获取订单列表' };
      }

      return { success: false, msg: '无法获取订单列表' };
    } catch (error) {
      return { success: false, msg: '获取订单列表失败' };
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const xianyuPlatform = new XianyuPlatformService();
