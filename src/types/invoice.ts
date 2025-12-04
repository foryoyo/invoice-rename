/**
 * 发票数据接口 - AI识别后的结构化数据
 */
export interface InvoiceData {
  /** 销售方名称 */
  sellerName: string;
  /** 销售方统一社会信用代码 */
  sellerTaxId: string;
  /** 购方名称 */
  buyerName: string;
  /** 购方统一社会信用代码 */
  buyerTaxId: string;
  /** 开票金额 */
  amount: string;
  /** 开票日期 YYYY-MM-DD */
  date: string;
  /** 发票号码 */
  invoiceNumber: string;
}

/**
 * 发票状态
 */
export type InvoiceStatus = "pending" | "processing" | "completed" | "error";

/**
 * 发票对象
 */
export interface Invoice {
  /** 唯一ID */
  id: string;
  /** 原始File对象 */
  file: File;
  /** 预览图片(base64) */
  preview: string;
  /** 处理状态 */
  status: InvoiceStatus;
  /** 识别后的数据 */
  data?: InvoiceData;
  /** 错误信息 */
  error?: string;
  /** 新文件名 */
  newFileName?: string;
}

/**
 * API配置
 */
export interface AppConfig {
  /** API端点 */
  apiEndpoint: string;
  /** API密钥 */
  apiKey: string;
  /** 模型名称 */
  model: string;
  /** 最大并发数 */
  maxConcurrent: number;
  /** 自定义参数 (JSON字符串) */
  customParams?: string;
}

/**
 * 字段名称类型
 */
export type FieldName = keyof InvoiceData;

/**
 * 字段配置
 */
export interface FieldConfig {
  /** 字段名 */
  name: FieldName;
  /** 显示标签 */
  label: string;
  /** 是否选中 */
  enabled: boolean;
  /** 排序顺序 */
  order: number;
}

/**
 * 文件分隔符
 */
export type Separator = string;
