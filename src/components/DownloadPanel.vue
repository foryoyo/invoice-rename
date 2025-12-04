<script setup lang="ts">
import { ref, computed } from "vue";
import type { Invoice } from "../types/invoice";
import fileService from "../services/fileService";

interface Props {
  invoices: Invoice[];
}

const props = defineProps<Props>();

const downloading = ref(false);

// 可下载的发票（已完成识别且有新文件名）
const downloadableInvoices = computed(() =>
  props.invoices.filter((inv) => inv.status === "completed" && inv.newFileName)
);

const totalSize = computed(() => {
  const bytes = downloadableInvoices.value.reduce(
    (sum, inv) => sum + inv.file.size,
    0
  );
  return fileService.formatFileSize(bytes);
});

const handleDownloadSingle = (invoice: Invoice) => {
  if (!invoice.newFileName) return;
  fileService.downloadFile(invoice, invoice.newFileName);
};

const handleDownloadAll = async () => {
  if (downloadableInvoices.value.length === 0) return;

  downloading.value = true;
  try {
    await fileService.downloadAsZip(
      downloadableInvoices.value,
      "发票_" + Date.now() + ".zip"
    );
  } catch (error) {
    console.error("下载失败:", error);
    alert("下载失败: " + (error as Error).message);
  } finally {
    downloading.value = false;
  }
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">下载文件</h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ downloadableInvoices.length }} 个文件准备就绪 · 总大小
          {{ totalSize }}
        </p>
      </div>

      <button
        v-if="downloadableInvoices.length > 0"
        @click="handleDownloadAll"
        :disabled="downloading"
        class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        <svg
          v-if="downloading"
          class="w-5 h-5 animate-spin"
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
        <svg
          v-else
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>{{ downloading ? "打包中..." : "全部下载 (ZIP)" }}</span>
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="downloadableInvoices.length === 0" class="text-center py-12">
      <svg
        class="w-16 h-16 text-gray-300 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
        />
      </svg>
      <p class="text-gray-500">暂无可下载的文件</p>
      <p class="text-sm text-gray-400 mt-1">请先上传并识别发票</p>
    </div>

    <!-- 文件列表 -->
    <div v-else class="space-y-2">
      <div
        v-for="invoice in downloadableInvoices"
        :key="invoice.id"
        class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div class="flex items-center space-x-4 flex-1 min-w-0">
          <!-- 文件图标 -->
          <div
            class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <svg
              class="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          <!-- 文件信息 -->
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-gray-900 truncate"
              :title="invoice.newFileName"
            >
              {{ invoice.newFileName }}
            </p>
            <p class="text-xs text-gray-500">
              {{ fileService.formatFileSize(invoice.file.size) }}
            </p>
          </div>
        </div>

        <!-- 下载按钮 -->
        <button
          @click="handleDownloadSingle(invoice)"
          class="ml-4 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          下载
        </button>
      </div>
    </div>
  </div>
</template>
