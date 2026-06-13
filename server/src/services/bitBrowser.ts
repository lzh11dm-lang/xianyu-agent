/**
 * 比特浏览器 API 客户端
 * 文档参考: http://www.bitbrowser.cn/docs
 */

const BIT_BROWSER_API = 'http://127.0.0.1:54345';

interface BrowserInfo {
  id: string;
  name: string;
  remarks: string;
  status: string;
}

interface Browser {
  id: string;
  name: string;
  chromeVersion: string;
  selenium: string;
  playwright: string;
  extensionId: string;
}

class BitBrowserClient {
  private apiKey: string = '';

  /**
   * 设置 API Key
   */
  setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * 打开浏览器窗口
   */
  async openBrowser(launchId: string): Promise<{ success: boolean; data?: any; msg?: string }> {
    try {
      const response = await fetch(`${BIT_BROWSER_API}/browser/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: launchId,
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: '无法连接到比特浏览器，请确认浏览器已启动' };
    }
  }

  /**
   * 关闭浏览器窗口
   */
  async closeBrowser(launchId: string): Promise<{ success: boolean; msg?: string }> {
    try {
      const response = await fetch(`${BIT_BROWSER_API}/browser/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: launchId,
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: '无法连接到比特浏览器' };
    }
  }

  /**
   * 获取浏览器列表
   */
  async listBrowsers(): Promise<{ success: boolean; data?: BrowserInfo[]; msg?: string }> {
    try {
      const response = await fetch(`${BIT_BROWSER_API}/browser/list`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: '无法连接到比特浏览器' };
    }
  }

  /**
   * 创建浏览器配置文件
   */
  async createProfile(name: string, remarks: string = ''): Promise<{ success: boolean; data?: Browser; msg?: string }> {
    try {
      const response = await fetch(`${BIT_BROWSER_API}/browser/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          remarks,
          platform: 'windows',
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: '无法连接到比特浏览器' };
    }
  }

  /**
   * 打开新标签页
   */
  async openNewTab(launchId: string, url: string): Promise<{ success: boolean; data?: { id: string }; msg?: string }> {
    try {
      const response = await fetch(`${BIT_BROWSER_API}/browser/open-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: launchId,
          url,
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: '无法打开新标签' };
    }
  }

  /**
   * 执行 JavaScript
   */
  async executeScript(launchId: string, script: string): Promise<{ success: boolean; data?: any; msg?: string }> {
    try {
      const response = await fetch(`${BIT_BROWSER_API}/browser/execute-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: launchId,
          script,
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: '执行脚本失败' };
    }
  }

  /**
   * 获取当前页面 HTML
   */
  async getPageSource(launchId: string): Promise<{ success: boolean; data?: string; msg?: string }> {
    try {
      const response = await fetch(`${BIT_BROWSER_API}/browser/get-page-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: launchId,
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: '获取页面源码失败' };
    }
  }

  /**
   * 点击元素
   */
  async clickElement(launchId: string, selector: string): Promise<{ success: boolean; msg?: string }> {
    const script = `
      (function() {
        const el = document.querySelector('${selector}');
        if (el) {
          el.click();
          return true;
        }
        return false;
      })()
    `;
    const result = await this.executeScript(launchId, script);
    return { success: result.success, msg: result.success ? '点击成功' : '未找到元素' };
  }

  /**
   * 填写输入框
   */
  async fillInput(launchId: string, selector: string, value: string): Promise<{ success: boolean; msg?: string }> {
    const script = `
      (function() {
        const el = document.querySelector('${selector}');
        if (el) {
          el.value = '${value.replace(/'/g, "\\'")}';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      })()
    `;
    const result = await this.executeScript(launchId, script);
    return { success: result.success, msg: result.success ? '填写成功' : '未找到元素' };
  }

  /**
   * 等待元素出现
   */
  async waitForElement(launchId: string, selector: string, timeout: number = 5000): Promise<{ success: boolean; msg?: string }> {
    const script = `
      (function() {
        return new Promise((resolve) => {
          const el = document.querySelector('${selector}');
          if (el) {
            resolve(true);
            return;
          }
          const observer = new MutationObserver(() => {
            const el = document.querySelector('${selector}');
            if (el) {
              observer.disconnect();
              resolve(true);
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          setTimeout(() => {
            observer.disconnect();
            resolve(false);
          }, ${timeout});
        });
      })()
    `;
    const result = await this.executeScript(launchId, script);
    return { success: result.success && result.data, msg: result.success ? '元素已出现' : '等待超时' };
  }

  /**
   * 截图
   */
  async screenshot(launchId: string): Promise<{ success: boolean; data?: string; msg?: string }> {
    try {
      const response = await fetch(`${BIT_BROWSER_API}/browser/screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: launchId,
          fullPage: false,
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: '截图失败' };
    }
  }
}

export const bitBrowser = new BitBrowserClient();
