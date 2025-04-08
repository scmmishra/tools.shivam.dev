<script setup lang="ts">
import { ref } from "vue";
import { useDebounceFn } from "@vueuse/core";

import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextInput from "../components/form/TextInput.vue";
import TextArea from "../components/form/TextArea.vue";
import Select from "../components/form/Select.vue";
import Result from "../components/Result.vue";

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
    error.value = (err as Error).message;
  }
}

const debouncedGenerateHmac = useDebounceFn(generateHmac, 500);

const updateMessage = (newValue: string | undefined) => {
  message.value = newValue ?? "";
  debouncedGenerateHmac();
};

const updateSecretKey = (newValue: string | undefined) => {
  secretKey.value = newValue ?? "";
  debouncedGenerateHmac();
};

const updateAlgorithm = (newValue: string) => {
  algorithm.value = newValue;
  debouncedGenerateHmac();
};
</script>

<template>
  <ToolLayout
    :name="Tools.Hmac"
    :persist-keys="['hmac-secret-key', 'hmac-message', 'hmac-algorithm']"
  >
    <TextInput
      id="secretKey"
      label="Secret Key"
      placeholder="Enter secret key"
      v-model="secretKey"
      @update="updateSecretKey"
      persist="hmac-secret-key"
    />

    <TextArea
      id="message"
      label="Message"
      placeholder="Enter message"
      v-model="message"
      @update="updateMessage"
      persist="hmac-message"
    />

    <Select
      id="algorithm"
      label="Algorithm"
      :options="algorithmOptions"
      v-model="algorithm"
      @update="updateAlgorithm"
      persist="hmac-algorithm"
    />

    <Result
      title="HMAC Result"
      :value="hmacResult"
      placeholder="Enter a message and secret key to generate HMAC"
      :error="error"
    />
  </ToolLayout>
</template>
