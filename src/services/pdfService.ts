import * as pdfjsLib from "pdfjs-dist";

// 使用本地 Worker，避免 CDN 加载失败
// 使用 ?url 让 Vite 处理资源路径
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// 配置PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * PDF处理服务
 */
class PDFService {
  /**
   * 将PDF文件转换为Base64图片（第一页）
   * @param file PDF文件
   * @param scale 缩放比例，默认2.0
   * @returns Base64图片数据
   */
  async convertPDFToImage(file: File, scale: number = 1.5): Promise<string> {
    try {
      // 读取PDF文件
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // 获取第一页
      const page = await pdf.getPage(1);

      // 创建canvas
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("无法创建Canvas上下文");
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // 渲染PDF页面到canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      } as any;

      await page.render(renderContext).promise;

      // 转换为Base64 (使用JPEG格式减小体积)
      return canvas.toDataURL("image/jpeg", 0.8);
    } catch (error) {
      console.error("PDF转图片失败:", error);
      throw new Error("PDF转图片失败: " + (error as Error).message);
    }
  }

  /**
   * 生成PDF缩略图
   * @param file PDF文件
   * @returns Base64缩略图
   */
  async generateThumbnail(file: File): Promise<string> {
    // 使用较小的缩放比例生成缩略图
    return this.convertPDFToImage(file, 1.0);
  }

  /**
   * 获取PDF页数
   * @param file PDF文件
   * @returns 页数
   */
  async getPageCount(file: File): Promise<number> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.error("获取PDF页数失败:", error);
      return 0;
    }
  }
}

export default new PDFService();
