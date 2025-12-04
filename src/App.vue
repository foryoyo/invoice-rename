<script setup lang="ts">
import { ref, watch, computed } from "vue";
import draggable from "vuedraggable";
import type {
  Invoice,
  AppConfig,
  FieldConfig,
  Separator,
} from "./types/invoice";
import configService from "./services/configService";
import aiService from "./services/aiService";
import fileService from "./services/fileService";
import FileUploader from "./components/FileUploader.vue";
import ConfigModal from "./components/ConfigModal.vue";
import PreviewModal from "./components/PreviewModal.vue";

// 全局状态
const invoices = ref<Invoice[]>([]);
const config = ref<AppConfig>(configService.getConfig());
const showConfigModal = ref(false);
const separator = ref<Separator>("_");
const previewFile = ref<File | null>(null);

// 字段配置
const fields = ref<FieldConfig[]>([
  { name: "date", label: "开票日期", enabled: true, order: 1 },
  { name: "sellerName", label: "销售方名称", enabled: true, order: 2 },
  { name: "amount", label: "开票金额", enabled: true, order: 3 },
  { name: "buyerName", label: "购方名称", enabled: false, order: 4 },
  { name: "invoiceNumber", label: "发票号码", enabled: false, order: 5 },
  { name: "sellerTaxId", label: "销售方税号", enabled: false, order: 6 },
  { name: "buyerTaxId", label: "购方税号", enabled: false, order: 7 },
]);

// 初始化AI服务
aiService.setConfig(config.value);

// 统计
const stats = computed(() => ({
  total: invoices.value.length,
  completed: invoices.value.filter((inv) => inv.status === "completed").length,
  processing: invoices.value.filter((inv) => inv.status === "processing")
    .length,
  error: invoices.value.filter((inv) => inv.status === "error").length,
}));

// 处理配置更新
const handleConfigUpdate = (newConfig: AppConfig) => {
  config.value = newConfig;
  configService.saveConfig(newConfig);
  aiService.setConfig(newConfig);
  showConfigModal.value = false;
};

// 处理文件上传
const handleUpload = async (newInvoices: Invoice[]) => {
  if (!config.value.apiKey) {
    showConfigModal.value = true;
    return;
  }

  // 记录起始索引
  const startIdx = invoices.value.length;
  // 添加到列表
  invoices.value = [...invoices.value, ...newInvoices];

  // 获取响应式对象（从invoices.value中获取刚刚添加的项）
  const addedInvoices = invoices.value.slice(startIdx);

  // 自动识别（并发执行）
  addedInvoices.forEach(async (invoice) => {
    invoice.status = "processing";
    try {
      const data = await aiService.recognizeInvoice(invoice.file);
      invoice.data = data;
      invoice.status = "completed";
      updateFileName(invoice);
    } catch (error) {
      invoice.status = "error";
      invoice.error = (error as Error).message;
    }
  });
};

// 更新文件名
const updateFileName = (invoice: Invoice) => {
  if (invoice.status === "completed" && invoice.data) {
    // 根据当前 fields 数组的顺序生成文件名
    invoice.newFileName = fileService.generateFileName(
      invoice,
      fields.value,
      separator.value
    );
  }
};

// 批量操作
const handleRemove = (id: string) => {
  invoices.value = invoices.value.filter((inv) => inv.id !== id);
};

const handleClearAll = () => {
  if (confirm("确定要清空所有文件吗？")) {
    invoices.value = [];
  }
};

const handleRetry = async (id: string) => {
  const invoice = invoices.value.find((inv) => inv.id === id);
  if (!invoice) return;

  invoice.error = undefined;
  invoice.status = "processing";

  try {
    const data = await aiService.recognizeInvoice(invoice.file);
    invoice.data = data;
    invoice.status = "completed";
    updateFileName(invoice);
  } catch (error) {
    invoice.status = "error";
    invoice.error = (error as Error).message;
  }
};

// 监听配置变化
watch(
  [fields, separator],
  () => {
    // 更新 order 属性以匹配当前数组顺序
    fields.value.forEach((field, index) => {
      field.order = index + 1;
    });
    invoices.value.forEach((inv) => updateFileName(inv));
  },
  { deep: true }
);

// 下载
const handleDownloadAll = async () => {
  const completedInvoices = invoices.value.filter(
    (inv) => inv.status === "completed" && inv.newFileName
  );
  if (completedInvoices.length === 0) return;
  await fileService.downloadAsZip(
    completedInvoices,
    `发票重命名_${new Date().toISOString().slice(0, 10)}.zip`
  );
};
</script>

<template>
  <div
    class="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white"
  >
    <!-- Header -->
    <header
      class="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-sm"
    >
      <div
        class="container mx-auto px-4 h-14 flex items-center justify-between max-w-7xl"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white shadow-sm"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div class="flex flex-col">
            <h1
              class="font-bold text-base tracking-tight text-zinc-900 leading-tight"
            >
              发票批量重命名助手
            </h1>
            <p class="text-xs text-zinc-500 font-medium">
              基于 AI 识别的智能发票批量重命名工具
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div
            v-if="stats.total > 0"
            class="hidden md:flex items-center gap-4 text-xs font-medium text-zinc-500"
          >
            <span>总计 {{ stats.total }}</span>
            <span
              v-if="stats.processing > 0"
              class="text-blue-600 flex items-center gap-1"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"
              ></span>
              处理中 {{ stats.processing }}
            </span>
            <span v-if="stats.error > 0" class="text-red-600"
              >失败 {{ stats.error }}</span
            >
          </div>

          <button
            @click="showConfigModal = true"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-zinc-100 h-9 px-4 py-2"
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            API 设置
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8 max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- 左侧：文件处理区 -->
        <div class="lg:col-span-8 flex flex-col gap-6">
          <!-- 上传组件 -->
          <FileUploader @upload="handleUpload" />

          <!-- 安全提示条 -->
          <div
            class="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-700"
          >
            <svg
              class="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>
              您的文件仅在浏览器本地进行处理，不会上传到任何服务器。AI
              识别过程通过API 直接与服务商通信，最大程度保障您的数据隐私。
            </p>
          </div>

          <!-- 文件列表 -->
          <div
            class="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex-1 flex flex-col"
          >
            <div
              class="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50"
            >
              <h2 class="font-semibold text-sm text-zinc-900">文件列表</h2>
              <div class="flex items-center gap-2">
                <button
                  v-if="invoices.length > 0"
                  @click="handleClearAll"
                  class="text-xs text-zinc-500 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
                >
                  清空列表
                </button>
                <button
                  v-if="stats.completed > 0"
                  @click="handleDownloadAll"
                  class="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 h-8 px-3 shadow-sm"
                >
                  下载全部 ({{ stats.completed }})
                </button>
              </div>
            </div>

            <div
              v-if="invoices.length === 0"
              class="p-12 text-center flex-1 flex flex-col justify-center"
            >
              <div
                class="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-6 h-6 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 class="text-sm font-medium text-zinc-900">暂无文件</h3>
              <p class="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                请在上方区域上传文件。支持批量上传，系统将自动识别并重命名。
              </p>
            </div>

            <div v-else class="divide-y divide-zinc-100">
              <div
                v-for="invoice in invoices"
                :key="invoice.id"
                class="group flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
              >
                <div class="flex items-center gap-4 min-w-0 flex-1">
                  <!-- 状态图标 -->
                  <div class="flex-shrink-0">
                    <div
                      v-if="invoice.status === 'pending'"
                      class="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"
                      title="等待处理"
                    >
                      <svg
                        class="w-4 h-4 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div
                      v-else-if="invoice.status === 'processing'"
                      class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"
                      title="正在识别"
                    >
                      <svg
                        class="w-4 h-4 text-blue-600 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <div
                      v-else-if="invoice.status === 'completed'"
                      class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center"
                      title="识别成功"
                    >
                      <svg
                        class="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div
                      v-else
                      class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"
                      title="识别失败"
                    >
                      <svg
                        class="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>

                  <!-- 文件信息 -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p
                        class="text-xs text-zinc-400 truncate"
                        :title="invoice.file.name"
                      >
                        {{ invoice.file.name }}
                      </p>
                      <span
                        class="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded"
                        >{{ (invoice.file.size / 1024).toFixed(0) }}KB</span
                      >
                    </div>

                    <div class="mt-1 flex items-center gap-2 h-5">
                      <template
                        v-if="
                          invoice.status === 'completed' && invoice.newFileName
                        "
                      >
                        <svg
                          class="w-3.5 h-3.5 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                        <p
                          class="text-sm font-bold text-blue-700 font-mono truncate bg-blue-50 px-2 py-0.5 rounded border border-blue-100 transition-all hover:shadow-sm"
                          :title="invoice.newFileName"
                        >
                          {{ invoice.newFileName }}
                        </p>
                      </template>
                      <p
                        v-else-if="invoice.status === 'processing'"
                        class="text-xs text-blue-600"
                      >
                        正在识别发票内容...
                      </p>
                      <p v-else-if="invoice.error" class="text-xs text-red-600">
                        {{ invoice.error }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 操作 -->
                <div
                  class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    @click="previewFile = invoice.file"
                    class="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="预览文件"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                  <button
                    v-if="invoice.status === 'error'"
                    @click="handleRetry(invoice.id)"
                    class="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="重试识别"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                  <button
                    @click="handleRemove(invoice.id)"
                    class="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="删除文件"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：配置面板 -->
        <div class="lg:col-span-4">
          <div
            class="bg-white rounded-xl border border-zinc-200 shadow-sm sticky top-24"
          >
            <div class="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
              <h2 class="font-semibold text-sm text-zinc-900">命名规则配置</h2>
            </div>

            <div class="p-6 space-y-8">
              <!-- 字段选择 -->
              <div class="space-y-4">
                <label
                  class="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3"
                  >包含字段</label
                >
                <draggable
                  v-model="fields"
                  item-key="name"
                  class="space-y-2"
                  handle=".drag-handle"
                  :animation="200"
                >
                  <template #item="{ element: field }">
                    <div
                      class="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-all group"
                      :class="{
                        'border-zinc-900 ring-1 ring-zinc-900/5': field.enabled,
                      }"
                    >
                      <div class="flex items-center gap-3 flex-1">
                        <!-- 拖拽手柄 -->
                        <div
                          class="drag-handle cursor-move text-zinc-300 hover:text-zinc-600 p-1 -ml-1"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M4 8h16M4 16h16"
                            />
                          </svg>
                        </div>

                        <!-- 复选框 -->
                        <label
                          class="flex items-center gap-3 cursor-pointer flex-1 select-none"
                        >
                          <div class="relative flex items-center">
                            <input
                              type="checkbox"
                              v-model="field.enabled"
                              class="peer h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                            />
                          </div>
                          <span
                            class="text-sm font-medium text-zinc-700 group-hover:text-zinc-900"
                            >{{ field.label }}</span
                          >
                        </label>
                      </div>
                    </div>
                  </template>
                </draggable>
              </div>

              <!-- 分隔符 -->
              <div class="space-y-4">
                <label
                  class="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3"
                  >分隔符</label
                >
                <div class="grid grid-cols-3 gap-3">
                  <button
                    v-for="sep in ['_', '-']"
                    :key="sep"
                    @click="separator = sep"
                    class="h-10 w-full rounded-lg border flex items-center justify-center text-sm font-mono transition-all"
                    :class="
                      separator === sep
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                    "
                  >
                    {{ sep }}
                  </button>
                  <div class="relative w-full">
                    <input
                      type="text"
                      v-model="separator"
                      maxlength="5"
                      placeholder="自定义"
                      class="block w-full h-10 rounded-lg border py-2 px-3 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-900 sm:text-sm sm:leading-6 font-mono text-center transition-all"
                      :class="
                        !['_', '-'].includes(separator)
                          ? 'border-zinc-900 ring-1 ring-zinc-900'
                          : 'border-zinc-200 hover:border-zinc-300'
                      "
                    />
                  </div>
                </div>
              </div>

              <!-- 提示 -->
              <div
                class="bg-zinc-50 rounded-lg p-3 text-xs text-zinc-500 leading-relaxed"
              >
                <p>
                  💡
                  提示：勾选的字段将按顺序组合，配置更改会立即应用到所有文件。您可以在左侧列表实时预览重命名结果。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Config Modal -->
    <ConfigModal
      v-if="showConfigModal"
      :current-config="config"
      @close="showConfigModal = false"
      @save="handleConfigUpdate"
    />

    <!-- Preview Modal -->
    <PreviewModal :file="previewFile" @close="previewFile = null" />
  </div>
</template>
