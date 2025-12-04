import JSZip from "jszip";
import type { Invoice, FieldConfig, Separator } from "../types/invoice";

/**
 * 文件处理服务
 */
class FileService {
  /**
   * 生成新文件名
   * @param invoice 发票对象
   * @param fields 字段配置
   * @param separator 分隔符
   * @returns 新文件名
   */
  generateFileName(
    invoice: Invoice,
    fields: FieldConfig[],
    separator: Separator = "_"
  ): string {
    if (!invoice.data) {
      return invoice.file.name;
    }

    // 按order排序并过滤启用的字段
    const enabledFields = fields
      .filter((f) => f.enabled)
      .sort((a, b) => a.order - b.order);

    // 提取字段值
    const parts = enabledFields
      .map((field) => {
        const value = invoice.data![field.name];
        return value ? String(value).trim() : "";
      })
      .filter(Boolean);

    if (parts.length === 0) {
      return invoice.file.name;
    }

    // 清理文件名中的非法字符
    const cleanParts = parts.map((part) => part.replace(/[<>:"/\\|?*]/g, ""));

    // 获取原文件扩展名
    const extension = invoice.file.name.split(".").pop() || "pdf";

    return `${cleanParts.join(separator)}.${extension}`;
  }

  /**
   * 下载单个文件
   * @param invoice 发票对象
   * @param fileName 新文件名
   */
  downloadFile(invoice: Invoice, fileName: string) {
    const url = URL.createObjectURL(invoice.file);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 批量下载为ZIP
   * @param invoices 发票列表
   * @param zipName ZIP文件名
   */
  async downloadAsZip(
    invoices: Invoice[],
    zipName: string = "invoices.zip"
  ): Promise<void> {
    const zip = new JSZip();

    // 添加文件到ZIP
    // 添加文件到ZIP
    const usedNames = new Set<string>();

    for (const invoice of invoices) {
      let fileName = invoice.newFileName || invoice.file.name;

      // 处理重名文件
      if (usedNames.has(fileName)) {
        const nameParts = fileName.split(".");
        const ext = nameParts.pop();
        const baseName = nameParts.join(".");
        let counter = 1;
        let newName = `${baseName} (${counter}).${ext}`;

        while (usedNames.has(newName)) {
          counter++;
          newName = `${baseName} (${counter}).${ext}`;
        }
        fileName = newName;
      }

      usedNames.add(fileName);
      const fileData = await invoice.file.arrayBuffer();
      zip.file(fileName, fileData);
    }

    // 生成ZIP
    const blob = await zip.generateAsync({ type: "blob" });

    // 下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = zipName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 验证文件类型
   * @param file 文件
   * @returns 是否为支持的文件类型
   */
  validateFileType(file: File): boolean {
    const supportedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    return supportedTypes.includes(file.type);
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的字符串
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

export default new FileService();
