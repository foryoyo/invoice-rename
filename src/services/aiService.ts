import OpenAI from "openai";
import type { AppConfig, InvoiceData } from "../types/invoice";
import pdfService from "./pdfService";
import configService from "./configService";

/**
 * AI识别系统提示词
 */
const SYSTEM_PROMPT = `你是一个专业的发票OCR识别助手。
请从图片中提取以下信息，并以纯JSON格式返回：
{
  "sellerName": "销售方名称",
  "sellerTaxId": "销售方统一社会信用代码",
  "buyerName": "购方名称",
  "buyerTaxId": "购方统一社会信用代码",
  "amount": "开票金额（数字）",
  "date": "开票日期（YYYY-MM-DD格式）",
  "invoiceNumber": "发票号码"
}

注意：
1. 必须直接返回JSON字符串，严禁使用Markdown代码块（如 \`\`\`json）
2. 不要包含任何解释性文字
3. 如果某个字段无法识别，请返回空字符串""
4. 日期必须是YYYY-MM-DD格式
5. 金额只保留数字和小数点`;

/**
 * AI识别服务
 */
class AIService {
  private config: AppConfig | null = null;
  private pendingRequests = 0;

  /**
   * 设置配置
   */
  setConfig(config: AppConfig) {
    this.config = config;
  }

  /**
   * 识别发票
   * @param file PDF文件
   * @returns 识别结果
   */
  async recognizeInvoice(file: File): Promise<InvoiceData> {
    if (!this.config) {
      throw new Error("请先配置API");
    }

    // 并发控制
    while (this.pendingRequests >= this.config.maxConcurrent) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.pendingRequests++;

    try {
      // 将PDF转换为图片
      const base64Image = await pdfService.convertPDFToImage(file, 2.0);
      console.log("PDF转换成功，Base64长度:", base64Image.length);
      console.log("Base64前缀:", base64Image.substring(0, 50));

      // 调用AI API
      const result = await this.callAI(base64Image);

      return result;
    } finally {
      this.pendingRequests--;
    }
  }

  /**
   * 调用AI API（支持重试）
   */
  private async callAI(base64Image: string, retries = 3): Promise<InvoiceData> {
    if (!this.config) {
      throw new Error("配置未设置");
    }

    const baseURL = configService.getSdkBaseUrl(this.config.apiEndpoint);

    const client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: baseURL,
      dangerouslyAllowBrowser: true,
      timeout: 30000, // 30秒超时
    });

    // 解析自定义参数
    let customParams = {};
    if (
      this.config.customParams &&
      this.config.customParams.trim().length > 0
    ) {
      try {
        customParams = JSON.parse(this.config.customParams);
      } catch (e) {
        console.warn("解析自定义参数失败:", e);
      }
    }

    for (let i = 0; i < retries; i++) {
      try {
        const completion = await client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "请识别这张发票图片，提取相关信息并按 JSON 格式返回。",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image,
                    detail: "auto",
                  },
                },
              ],
            },
          ],

          max_tokens: 4000,
          temperature: 0.1,
          ...customParams,
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
          throw new Error("AI返回内容为空");
        }

        // 解析JSON
        const invoiceData = this.parseResponse(content);
        return invoiceData;
      } catch (error) {
        console.error(`AI识别失败 (尝试 ${i + 1}/${retries}):`, error);

        if (i === retries - 1) {
          throw new Error((error as Error).message);
        }

        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw new Error("AI识别失败：超过最大重试次数");
  }

  /**
   * 解析AI返回的JSON
   */
  private parseResponse(content: string): InvoiceData {
    try {
      console.log("AI原始响应:", content);

      // 使用正则提取JSON部分（寻找最外层的花括号）
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("响应中未找到有效的JSON对象");
      }

      const jsonStr = jsonMatch[0];
      const data = JSON.parse(jsonStr) as InvoiceData;

      // 验证必要字段
      return {
        sellerName: data.sellerName || "",
        sellerTaxId: data.sellerTaxId || "",
        buyerName: data.buyerName || "",
        buyerTaxId: data.buyerTaxId || "",
        amount: data.amount || "",
        date: data.date || "",
        invoiceNumber: data.invoiceNumber || "",
      };
    } catch (error) {
      console.error("解析AI响应失败:", error, content);
      throw new Error("解析AI响应失败: " + (error as Error).message);
    }
  }
}

export default new AIService();
