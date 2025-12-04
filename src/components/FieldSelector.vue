<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { FieldConfig, Separator, Invoice } from "../types/invoice";
import fileService from "../services/fileService";

interface Props {
  fields: FieldConfig[];
  invoices: Invoice[];
}

interface Emits {
  update: [fields: FieldConfig[], separator: Separator];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const separator = ref<Separator>("_");
const localFields = ref<FieldConfig[]>([...props.fields]);

// 监听字段变化并通知父组件
watch(
  [localFields, separator],
  () => {
    emit("update", localFields.value, separator.value);
  },
  { deep: true }
);

// 切换字段启用状态
const toggleField = (fieldName: string) => {
  const field = localFields.value.find((f) => f.name === fieldName);
  if (field) {
    field.enabled = !field.enabled;
  }
};

// 预览文件名示例
const previewFileName = computed(() => {
  const completedInvoice = props.invoices.find(
    (inv) => inv.status === "completed" && inv.data
  );
  if (!completedInvoice) {
    return "请先识别发票以查看预览";
  }
  return fileService.generateFileName(
    completedInvoice,
    localFields.value,
    separator.value
  );
});

const separatorOptions = [
  {
    value: "_" as Separator,
    label: "下划线 (_)",
    example: "文件_名称_示例.pdf",
  },
  {
    value: "-" as Separator,
    label: "中划线 (-)",
    example: "文件-名称-示例.pdf",
  },
  { value: " " as Separator, label: "空格 ( )", example: "文件 名称 示例.pdf" },
];
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">文件命名配置</h2>

    <!-- 字段选择 -->
    <div class="space-y-3 mb-6">
      <p class="text-sm text-gray-600">选择用于文件命名的字段：</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label
          v-for="field in localFields"
          :key="field.name"
          class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          :class="{ 'bg-primary-50 border-primary-300': field.enabled }"
        >
          <input
            type="checkbox"
            :checked="field.enabled"
            @change="toggleField(field.name)"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
          />
          <span class="text-sm font-medium text-gray-900 flex-1">
            {{ field.label }}
          </span>
          <span
            v-if="field.enabled"
            class="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full"
          >
            {{ field.order }}
          </span>
        </label>
      </div>

      <p class="text-xs text-gray-500 flex items-center space-x-1">
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>数字表示字段在文件名中的排序</span>
      </p>
    </div>

    <!-- 分隔符选择 -->
    <div class="space-y-3 mb-6">
      <p class="text-sm text-gray-600">选择字段分隔符：</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label
          v-for="option in separatorOptions"
          :key="option.value"
          class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          :class="{
            'bg-primary-50 border-primary-300': separator === option.value,
          }"
        >
          <input
            type="radio"
            :value="option.value"
            v-model="separator"
            class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">
              {{ option.label }}
            </div>
            <div class="text-xs text-gray-500 font-mono">
              {{ option.example }}
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- 文件名预览 -->
    <div
      class="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-200"
    >
      <div class="flex items-start space-x-3">
        <svg
          class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
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
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 mb-1">文件名预览</p>
          <p
            class="text-sm text-gray-700 font-mono break-all bg-white rounded px-3 py-2 border border-primary-200"
          >
            {{ previewFileName }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
