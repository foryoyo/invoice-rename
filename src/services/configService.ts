import OpenAI from "openai";
import type { AppConfig } from "../types/invoice";

const CONFIG_KEY = "invoice_rename_config";

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AppConfig = {
  apiEndpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-4o-mini",
  maxConcurrent: 3,
  customParams: "",
};

/**
 * 配置管理服务
 */
class ConfigService {
  /**
   * 获取配置
   */
  getConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) {
        const config = JSON.parse(stored) as AppConfig;
        return { ...DEFAULT_CONFIG, ...config };
      }
    } catch (error) {
      console.error("读取配置失败:", error);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * 保存配置
   */
  saveConfig(config: AppConfig): boolean {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error("保存配置失败:", error);
      return false;
    }
  }

  /**
   * 重置为默认配置
   */
  resetConfig(): AppConfig {
    try {
      localStorage.removeItem(CONFIG_KEY);
    } catch (error) {
      console.error("重置配置失败:", error);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * 验证配置
   */
  validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.apiEndpoint || !config.apiEndpoint.startsWith("http")) {
      errors.push("API端点格式不正确");
    }

    if (!config.apiKey || config.apiKey.trim().length === 0) {
      errors.push("API密钥不能为空");
    }

    if (!config.model || config.model.trim().length === 0) {
      errors.push("模型名称不能为空");
    }

    if (config.maxConcurrent < 1 || config.maxConcurrent > 10) {
      errors.push("最大并发数应在1-10之间");
    }

    if (config.customParams && config.customParams.trim().length > 0) {
      try {
        JSON.parse(config.customParams);
      } catch (e) {
        errors.push("自定义参数必须是有效的JSON格式");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取SDK需要的Base URL
   * 自动处理 /chat/completions 和 /v1 后缀
   */
  getSdkBaseUrl(url: string): string {
    let endpoint = url.trim();
    // 移除末尾斜杠
    while (endpoint.endsWith("/")) {
      endpoint = endpoint.slice(0, -1);
    }

    // 如果包含 /chat/completions，移除它
    if (endpoint.endsWith("/chat/completions")) {
      endpoint = endpoint.substring(
        0,
        endpoint.length - "/chat/completions".length
      );
    }

    // 再次移除末尾斜杠
    while (endpoint.endsWith("/")) {
      endpoint = endpoint.slice(0, -1);
    }

    // 如果以 /v1 结尾，直接返回
    if (endpoint.endsWith("/v1")) {
      return endpoint;
    }

    // 否则追加 /v1
    return `${endpoint}/v1`;
  }

  /**
   * 测试API连接
   */
  async testConnection(
    config: AppConfig
  ): Promise<{ success: boolean; message: string }> {
    try {
      const baseURL = this.getSdkBaseUrl(config.apiEndpoint);
      console.log("Testing connection to Base URL:", baseURL);

      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: baseURL,
        dangerouslyAllowBrowser: true,
      });

      await client.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5,
      });

      return { success: true, message: "连接成功" };
    } catch (error) {
      console.error("Connection test failed:", error);
      return {
        success: false,
        message: `连接失败: ${
          (error as Error).message
        }. 请检查 API Endpoint 是否正确，以及是否存在跨域(CORS)限制。`,
      };
    }
  }
}

export default new ConfigService();
