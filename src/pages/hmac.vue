<template>
  <div class="space-y-6">
    <h1 class="text-xl font-medium uppercase tracking-wider truncate">
      HMAC Generator
    </h1>

    <div class="space-y-2">
      <label for="secretKey" class="block text-sm font-medium text-gray-700"
        >Secret Key:</label
      >
      <input
        type="text"
        id="secretKey"
        :value="secretKey"
        @input="updateSecretKey"
        class="w-full px-3 py-2 outline outline-gray-200 focus:outline-gray-400 transition-colors overflow-hidden"
        placeholder="Enter secret key"
      />
    </div>

    <div class="space-y-2">
      <label for="message" class="block text-sm font-medium text-gray-700"
        >Message:</label
      >
      <textarea
        id="message"
        :value="message"
        @input="updateMessage"
        rows="3"
        class="w-full px-3 py-2 outline outline-gray-200 focus:outline-gray-400 transition-colors resize-none overflow-auto"
        placeholder="Enter message"
      ></textarea>
    </div>

    <div class="space-y-2">
      <label for="algorithm" class="block text-sm font-medium text-gray-700"
        >Algorithm:</label
      >
      <select
        id="algorithm"
        :value="algorithm"
        @change="updateAlgorithm"
        class="w-full px-3 py-2 outline outline-gray-200 focus:outline-gray-400 transition-colors overflow-hidden"
      >
        <option
          v-for="option in algorithmOptions"
          :key="option"
          :value="option"
        >
          {{ option }}
        </option>
      </select>
    </div>

    <div class="space-y-2">
      <h3 class="text-sm font-medium text-gray-700">HMAC Result:</h3>
      <p
        class="font-mono px-3 py-2 bg-gray-50 outline outline-gray-200 break-all"
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
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDebounceFn } from "@vueuse/core";

const secretKey = ref("");
const message = ref("");
const algorithm = ref("SHA-256");
const hmacResult = ref("");
const error = ref("");

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

const updateMessage = (event) => {
  message.value = event.target.value;
  debouncedGenerateHmac();
};

const updateSecretKey = (event) => {
  secretKey.value = event.target.value;
  debouncedGenerateHmac();
};

const updateAlgorithm = (event) => {
  algorithm.value = event.target.value;
  debouncedGenerateHmac();
};

const algorithmOptions = ["SHA-256", "SHA-384", "SHA-512"];
</script>
