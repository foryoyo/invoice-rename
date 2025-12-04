# 发票批量重命名助手

基于 AI 识别的智能发票批量重命名工具。利用大语言模型（LLM）的多模态能力，自动提取发票关键信息并按规则重命名，极大提升财务文件整理效率。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue.js-3.x-4FC08D.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)

## ✨ 核心功能

- 🚀 **智能识别**：支持 GPT-4o, Claude 3.5 Sonnet, Gemini2.5 Pro 等具备视觉识别能力的 AI 模型。
- 📂 **批量处理**：支持拖拽或点击批量上传 PDF/图片发票，并发处理，速度飞快。
- 🛠️ **灵活配置**：
  - **自定义字段**：支持开票日期、销售方/购方名称、金额、税号等字段。
  - **拖拽排序**：自由调整文件名字段顺序。
  - **自定义分隔符**：支持下划线、中划线或任意自定义字符。
- 👁️ **实时预览**：
  - **文件预览**：内置 PDF 和图片查看器，无需下载即可核对内容。
  - **命名预览**：实时显示重命名后的文件名效果。
- 🔒 **隐私安全**：文件处理主要在本地进行，图片数据仅通过加密 API 发送至您配置的 AI 服务商，本应用服务器不存储任何文件。
- ⚙️ **高级设置**：支持自定义 API 参数（JSON），适配各种模型特定需求（如 Volcengine 的 `thinking` 参数）。

## 🛠️ 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **样式库**: [Tailwind CSS](https://tailwindcss.com/)
- **PDF 处理**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **文件打包**: [JSZip](https://stuk.github.io/jszip/)

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm (推荐) 或 npm/yarn

### 安装与运行

1. **克隆项目**

```bash
git clone https://github.com/yourusername/invoice-rename.git
cd invoice-rename
```

2. **安装依赖**

```bash
pnpm install
```

3. **启动开发服务器**

```bash
pnpm dev
```

访问 `http://localhost:5173` 即可使用。

4. **构建生产版本**

```bash
pnpm build
```

## 📖 使用指南

### 1. 配置 AI 服务

首次使用需点击右上角 **"API 设置"**：

- **API 接口地址**：OpenAI 兼容的接口地址（例如 `https://api.openai.com/v1` 或第三方代理地址）。
- **API 密钥**：您的 API Key。
- **模型名称**：选择支持 **Vision** 的模型（如 `gpt-4o`, `claude-3-5-sonnet-20240620`）。
- **自定义参数**：如有需要，可配置 JSON 格式的额外参数。

### 2. 上传与识别

- 将 PDF 或图片发票拖入上传区域。
- 系统将自动并发上传并调用 AI 进行识别。
- 识别完成后，文件名下方会显示生成的预览名称。

### 3. 调整命名规则

- 在右侧面板勾选需要的字段（如“开票金额”、“销售方名称”）。
- 拖动字段调整顺序。
- 设置喜欢的分隔符。

### 4. 导出结果

- 确认无误后，点击 **"全部下载 (ZIP)"**，系统将自动处理重名文件并打包下载。

## 🔒 安全声明

- **无后端存储**：本项目为纯前端应用（Serverless/Static），您的发票文件**不会**上传到服务器。
- **数据传输**：识别过程中，文件会被转换为 Base64 编码，直接发送至您配置的 AI API 端点。请确保您使用的 API 服务商符合您的安全要求。
- **本地配置**：API Key 等敏感配置仅存储在您浏览器的 LocalStorage 中。

## 📄 许可证

MIT License
