<script setup lang="ts">
import { computed, ref } from "vue";
import { useQRCode } from "@vueuse/integrations/useQRCode";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextArea from "../components/form/TextArea.vue";

const qrText = ref("");
const qrCode = useQRCode(qrText, {
  errorCorrectionLevel: "M",
  margin: 2,
  scale: 6,
});

const sanitizedFileName = computed(() => {
  if (!qrText.value) return "qr-code.png";
  const trimmed = qrText.value.trim().slice(0, 32) || "qr-code";
  return `${trimmed.replace(/[^a-z0-9-_]+/gi, "-")}.png`;
});

const downloadQRCode = () => {
  if (!qrCode.value) return;

  const link = document.createElement("a");
  link.href = qrCode.value;
  link.download = sanitizedFileName.value;
  link.click();
};
</script>

<template>
  <ToolLayout :name="Tools.QrCode" :persist-keys="['qr-text']">
    <div class="space-y-6">
      <TextArea
        id="qr-text"
        label="QR Content"
        placeholder="Enter the text, URL, or data you want to encode"
        v-model="qrText"
        :rows="4"
        persist="qr-text"
      />

      <div class="space-y-2">
        <h3 class="block text-xs uppercase tracking-wider text-gray-500">
          Preview
        </h3>
        <div
          class="flex items-center justify-center aspect-square max-w-xs mx-auto bg-white outline outline-gray-200"
        >
          <img
            v-if="qrCode"
            :src="qrCode"
            alt="Generated QR code"
            class="w-full h-full object-contain"
          />
          <p v-else class="text-sm text-gray-500 text-center px-6">
            QR code preview will appear here once you add content.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="w-full px-4 py-2 bg-gray-900 text-gray-100 text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :disabled="!qrCode"
        @click="downloadQRCode"
      >
        Download QR Code
      </button>
    </div>
  </ToolLayout>
</template>
