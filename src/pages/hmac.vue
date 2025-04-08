<template>
  <ToolLayout
    title="HMAC Generator"
    description="Generate a Hash-based Message Authentication Code (HMAC) to verify message integrity and authenticity using your secret key."
    :persist-keys="['hmac-secret-key', 'hmac-message', 'hmac-algorithm']"
  >
    <TextInput
      id="secretKey"
      label="Secret Key"
      placeholder="Enter secret key"
      v-model="secretKey"
      @update:modelValue="updateSecretKey"
      persist="hmac-secret-key"
    />

    <TextArea
      id="message"
      label="Message"
      placeholder="Enter message"
      v-model="message"
      @update:modelValue="updateMessage"
      persist="hmac-message"
    />

    <Select
      id="algorithm"
      label="Algorithm"
      :options="algorithmOptions"
      v-model="algorithm"
      @update:modelValue="updateAlgorithm"
      persist="hmac-algorithm"
    />

    <div class="space-y-2">
      <h3 class="text-sm font-medium text-gray-700">HMAC Result:</h3>
      <p
        class="font-mono px-3 py-2 bg-gray-50 outline outline-gray-200 break-all"
        :class="hmacResult ? '' : 'text-gray-400'"
      >
        {{ hmacResult || "Enter a message and secret key to generate HMAC" }}
      </p>
      <p
        v-if="error"
        class="font-mono px-3 py-2 bg-red-50 outline outline-red-200 text-red-600 break-all"
      >
        Error: {{ error }}
      </p>
    </div>
  </ToolLayout>
</template>

<script setup>
import { ref } from "vue";
import { useDebounceFn } from "@vueuse/core";
import ToolLayout from "../components/ToolLayout.vue";
import TextInput from "../components/form/TextInput.vue";
import TextArea from "../components/form/TextArea.vue";
import Select from "../components/form/Select.vue";

const secretKey = ref("");
const message = ref("");
const algorithm = ref("SHA-256");
const hmacResult = ref("");
const error = ref("");

const algorithmOptions = ["SHA-256", "SHA-384", "SHA-512"].map((value) => ({
  value,
}));

async function generateHmac() {
  if (!secretKey.value && !message.value) {
    hmacResult.value = "";
    error.value = "";
    return;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey.value);
    const messageData = encoder.encode(message.value);

    // Import the secret key
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "HMAC",
        hash: { name: algorithm.value },
      },
      false,
      ["sign"]
    );

    // Sign the message
    const signature = await window.crypto.subtle.sign("HMAC", key, messageData);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    hmacResult.value = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    error.value = "";
  } catch (err) {
    hmacResult.value = "";
    error.value = err.message;
  }
}

const debouncedGenerateHmac = useDebounceFn(generateHmac, 500);

const updateMessage = (newValue) => {
  message.value = newValue;
  debouncedGenerateHmac();
};

const updateSecretKey = (newValue) => {
  secretKey.value = newValue;
  debouncedGenerateHmac();
};

const updateAlgorithm = (newValue) => {
  algorithm.value = newValue;
  debouncedGenerateHmac();
};
</script>
