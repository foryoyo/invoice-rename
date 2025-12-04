<script setup lang="ts">
import { ref, reactive } from "vue";
import type { AppConfig } from "../types/invoice";
import configService from "../services/configService";

interface Props {
  currentConfig: AppConfig;
}

interface Emits {
  close: [];
  save: [config: AppConfig];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const config = reactive<AppConfig>({ ...props.currentConfig });
const showApiKey = ref(false);
const testing = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);
const errors = ref<string[]>([]);

const handleSave = () => {
  const validation = configService.validateConfig(config);
  if (!validation.valid) {
    errors.value = validation.errors;
    return;
  }
  errors.value = [];
  emit("save", { ...config });
};

const handleTest = async () => {
  const validation = configService.validateConfig(config);
  if (!validation.valid) {
    errors.value = validation.errors;
    return;
  }
  errors.value = [];
  testing.value = true;
  testResult.value = null;

  try {
    const result = await configService.testConnection(config);
    testResult.value = result;
  } catch (error) {
    testResult.value = {
      success: false,
      message: "测试失败: " + (error as Error).message,
    };
  } finally {
    testing.value = false;
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
    ></div>

    <!-- Modal -->
    <div
      class="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all border border-zinc-200"
    >
      <div
        class="px-6 py-4 border-b border-zinc-100 flex items-center justify-between"
      >
        <h3 class="text-base font-semibold leading-6 text-zinc-900">
          API 设置
        </h3>
        <button
          @click="emit('close')"
          class="text-zinc-400 hover:text-zinc-500 transition-colors"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div class="px-6 py-6 space-y-6">
        <!-- 错误提示 -->
        <div
          v-if="errors.length > 0"
          class="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100"
        >
          <ul class="list-disc list-inside space-y-1">
            <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
          </ul>
        </div>

        <!-- 测试结果 -->
        <div
          v-if="testResult"
          :class="[
            'rounded-md p-3 text-sm border flex items-center gap-2',
            testResult.success
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-red-50 text-red-700 border-red-100',
          ]"
        >
          <svg
            v-if="testResult.success"
            class="w-4 h-4"
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
          <svg
            v-else
            class="w-4 h-4"
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
          {{ testResult.message }}
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-zinc-700"
              >API 接口地址 (Endpoint)</label
            >
            <input
              v-model="config.apiEndpoint"
              type="url"
              class="block w-full rounded-md border-0 py-2 px-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-900 sm:text-sm sm:leading-6 transition-shadow"
              placeholder="https://api.openai.com/v1/chat/completions"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-zinc-700"
              >API 密钥 (Key)</label
            >
            <div class="relative">
              <input
                v-model="config.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                class="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-900 sm:text-sm sm:leading-6 transition-shadow font-mono"
                placeholder="sk-..."
              />
              <button
                type="button"
                @click="showApiKey = !showApiKey"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 cursor-pointer focus:outline-none"
                tabindex="-1"
              >
                <svg
                  v-if="!showApiKey"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
                <svg
                  v-else
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-zinc-700"
                >模型名称 (Model)</label
              >
              <input
                v-model="config.model"
                type="text"
                class="block w-full rounded-md border-0 py-2 px-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-900 sm:text-sm sm:leading-6 transition-shadow"
                placeholder="gpt-4o-mini"
              />
            </div>
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-zinc-700"
                >最大并发数</label
              >
              <input
                v-model.number="config.maxConcurrent"
                type="number"
                min="1"
                max="10"
                class="block w-full rounded-md border-0 py-2 px-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-900 sm:text-sm sm:leading-6 transition-shadow"
              />
            </div>

            <div
              class="col-span-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-100 flex items-start gap-2"
            >
              <svg
                class="w-4 h-4 mt-0.5 shrink-0 text-amber-600"
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
              <p class="leading-5">
                请确保使用的是<b>支持视觉识别</b>的模型（如 gpt-4o,
                gemini-2.5-pro，），否则无法识别发票。
              </p>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-zinc-700">
              自定义参数 (JSON)
              <span class="text-xs text-zinc-400 font-normal ml-1">(可选)</span>
            </label>
            <textarea
              v-model="config.customParams"
              rows="3"
              class="block w-full rounded-md border-0 py-2 px-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-900 sm:text-sm sm:leading-6 transition-shadow font-mono text-xs"
              placeholder='{ "reasoning": true }'
            ></textarea>
          </div>
        </div>
      </div>

      <div
        class="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between"
      >
        <button
          @click="handleTest"
          :disabled="testing"
          class="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50 transition-colors"
        >
          {{ testing ? "测试中..." : "测试连接" }}
        </button>
        <div class="flex items-center gap-3">
          <button
            @click="emit('close')"
            class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSave"
            class="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
