<script setup lang="ts">
import { ref, onUnmounted, watch } from "vue";

interface Props {
  file: File | null;
}

const props = defineProps<Props>();
const emit = defineEmits(["close"]);

const previewUrl = ref<string>("");
const isPdf = ref(false);

const createPreviewUrl = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  if (props.file) {
    previewUrl.value = URL.createObjectURL(props.file);
    isPdf.value = props.file.type === "application/pdf";
  } else {
    previewUrl.value = "";
    isPdf.value = false;
  }
};

watch(() => props.file, createPreviewUrl, { immediate: true });

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div
    v-if="file"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-zinc-900/75 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
    ></div>

    <!-- Modal -->
    <div
      class="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transform transition-all"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50"
      >
        <h3 class="text-lg font-semibold text-zinc-900 truncate pr-4">
          {{ file.name }}
        </h3>
        <button
          @click="emit('close')"
          class="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-200"
        >
          <svg
            class="w-6 h-6"
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
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 bg-zinc-100 overflow-hidden relative">
        <template v-if="previewUrl">
          <iframe
            v-if="isPdf"
            :src="previewUrl"
            class="w-full h-full border-0"
          ></iframe>
          <div
            v-else
            class="w-full h-full flex items-center justify-center overflow-auto p-4"
          >
            <img
              :src="previewUrl"
              class="max-w-full max-h-full object-contain shadow-lg rounded-sm"
              alt="Preview"
            />
          </div>
        </template>
        <div
          v-else
          class="flex items-center justify-center h-full text-zinc-400"
        >
          <p>无法预览此文件</p>
        </div>
      </div>
    </div>
  </div>
</template>
