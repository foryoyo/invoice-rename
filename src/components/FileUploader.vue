<script setup lang="ts">
import { ref } from "vue";
import type { Invoice } from "../types/invoice";
import fileService from "../services/fileService";
import pdfService from "../services/pdfService";

const emit = defineEmits<{
  upload: [invoices: Invoice[]];
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement>();
const isProcessing = ref(false);

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = async (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  await processFiles(files);
};

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  await processFiles(files);
  if (target) target.value = "";
};

const openFileDialog = () => {
  if (isProcessing.value) return;
  fileInput.value?.click();
};

const processFiles = async (files: File[]) => {
  isProcessing.value = true;

  const validFiles = files.filter((file) => {
    if (!fileService.validateFileType(file)) {
      alert(`文件 ${file.name} 格式不支持`);
      return false;
    }
    return true;
  });

  if (validFiles.length === 0) {
    isProcessing.value = false;
    return;
  }

  const newInvoices: Invoice[] = await Promise.all(
    validFiles.map(async (file) => {
      let preview = "";
      try {
        if (file.type === "application/pdf") {
          preview = await pdfService.generateThumbnail(file);
        } else {
          preview = await fileToBase64(file);
        }
      } catch (error) {
        console.error("生成预览失败:", error);
      }

      return {
        id: crypto.randomUUID(),
        file,
        preview,
        status: "pending" as const,
      };
    })
  );

  emit("upload", newInvoices);
  isProcessing.value = false;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
</script>

<template>
  <div
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="openFileDialog"
    class="relative group cursor-pointer"
  >
    <div
      class="w-full h-32 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2"
      :class="[
        isDragging
          ? 'border-zinc-900 bg-zinc-50'
          : 'border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50',
      ]"
    >
      <div v-if="isProcessing" class="flex flex-col items-center gap-2">
        <svg
          class="w-5 h-5 text-zinc-900 animate-spin"
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
        <span class="text-sm text-zinc-500">正在处理文件...</span>
      </div>

      <template v-else>
        <div
          class="p-2 rounded-lg bg-zinc-50 border border-zinc-100 group-hover:bg-white group-hover:shadow-sm transition-all"
        >
          <svg
            class="w-5 h-5 text-zinc-400 group-hover:text-zinc-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <div class="text-center">
          <p
            class="text-sm font-medium text-zinc-700 group-hover:text-zinc-900"
          >
            点击或拖拽上传发票
          </p>
          <p class="text-xs text-zinc-400 mt-0.5">支持 PDF, JPG, PNG</p>
        </div>
      </template>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>
