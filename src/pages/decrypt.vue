<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import HiddenInput from "../components/form/HiddenInput.vue"; // Import HiddenInput
import IconKey from "~icons/ph/key"; // Import the icon

const route = useRoute();

const passwordForDecryption = ref("");
const decryptedSecret = ref("");
const errorMessage = ref("");
const isProcessing = ref(false);
const encryptedPayloadFromUrl = ref<string | null>(null);

// --- Crypto Helper Functions (Copied for decryption) ---

// Base64 URL Safe Decoding
function base64UrlDecode(encoded: string): ArrayBuffer {
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (encoded.length % 4) {
    encoded += "=";
  }
  const binaryString = atob(encoded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive key from password using PBKDF2
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"] // Only need decrypt permission here
  );
}

// Decrypt data using AES-GCM
async function decryptData(
  password: string,
  salt: Uint8Array,
  iv: Uint8Array,
  ciphertext: ArrayBuffer
): Promise<string> {
  try {
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    // Check for common decryption error (likely wrong password)
    if (error instanceof DOMException && error.name === "OperationError") {
      throw new Error("Decryption failed. Likely incorrect password.");
    }
    throw new Error("Decryption failed. Incorrect password or corrupted data.");
  }
}

// --- Component Logic ---

async function decryptSecretFromPayload() {
  if (!encryptedPayloadFromUrl.value || !passwordForDecryption.value) return;
  isProcessing.value = true;
  errorMessage.value = "";
  decryptedSecret.value = "";

  try {
    const parts = encryptedPayloadFromUrl.value.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid data format in URL.");
    }
    const [saltEncoded, ivEncoded, ciphertextEncoded] = parts;

    // Validate lengths before decoding to prevent potential issues
    if (!saltEncoded || !ivEncoded || !ciphertextEncoded) {
      throw new Error("Invalid data payload in URL.");
    }

    const salt = new Uint8Array(base64UrlDecode(saltEncoded));
    const iv = new Uint8Array(base64UrlDecode(ivEncoded));
    const ciphertext = base64UrlDecode(ciphertextEncoded);

    // Basic validation of expected byte lengths after decoding
    if (salt.byteLength !== 16 || iv.byteLength !== 12) {
      console.warn(
        `Unexpected length after decoding - Salt: ${salt.byteLength}, IV: ${iv.byteLength}`
      );
      // Allow to proceed, but log a warning. Stricter validation could be added.
    }

    const decrypted = await decryptData(
      passwordForDecryption.value,
      salt,
      iv,
      ciphertext
    );
    decryptedSecret.value = decrypted;
  } catch (error: any) {
    console.error("Decryption error:", error);
    errorMessage.value = error.message || "Decryption failed.";
    passwordForDecryption.value = ""; // Clear password field on error
  } finally {
    isProcessing.value = false;
  }
}

function resetError() {
  errorMessage.value = "";
  passwordForDecryption.value = "";
}

onMounted(() => {
  const payload = route.params.payload;
  if (payload && typeof payload === "string") {
    // Basic format check
    if (payload.includes(".") && payload.split(".").length === 3) {
      encryptedPayloadFromUrl.value = payload;
      console.log("Encrypted payload found in route parameter.");
    } else {
      errorMessage.value = "Invalid or missing secret data in the URL.";
      console.error("Invalid payload format in route parameter:", payload);
    }
  } else {
    errorMessage.value = "No secret data found in the URL.";
    console.error("Missing or invalid payload route parameter:", payload);
  }
});
</script>

<template>
  <div
    class="decrypt-container min-h-screen flex items-center justify-center bg-gray-50 p-4"
  >
    <div
      class="bg-white p-6 rounded border border-gray-200 shadow-sm w-full max-w-md space-y-5"
    >
      <div class="space-y-1">
        <h1 class="text-xl font-semibold text-gray-800">Unlock Secret</h1>
        <p class="text-sm text-gray-600">
          Enter the password to view the secret.
        </p>
      </div>
      <div v-if="!decryptedSecret && !errorMessage" class="space-y-4">
        <HiddenInput
          id="password-decrypt"
          label="Password"
          v-model="passwordForDecryption"
          placeholder="Enter password"
          required
          @keyup.enter="decryptSecretFromPayload"
        />

        <button
          @click="decryptSecretFromPayload"
          :disabled="!passwordForDecryption || isProcessing"
          class="w-full px-4 py-2 bg-gray-900 text-gray-100 text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150"
        >
          <span v-if="!isProcessing" class="flex items-center gap-2">
            <IconKey class="h-4 w-4" />
            Unlock Secret
          </span>
          <span v-else class="flex items-center gap-2"> Processing... </span>
        </button>
      </div>

      <div v-if="decryptedSecret">
        <h2 class="text-sm font-medium text-gray-700 mb-2">
          Decrypted Secret:
        </h2>
        <div
          class="decrypted-section p-3 bg-green-50 border border-green-200 rounded"
        >
          <pre class="whitespace-pre-wrap text-sm text-green-900 break-all">{{
            decryptedSecret
          }}</pre>
        </div>
      </div>

      <div v-if="errorMessage">
        <h2 class="text-sm font-medium text-red-700 mb-2">Error:</h2>
        <div
          class="error-message p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm"
        >
          <p>{{ errorMessage }}</p>
          <button
            @click="resetError"
            class="mt-2 font-medium text-blue-600 hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
pre {
  /* white-space: pre-wrap; Ensure wrapping still happens */
  word-break: break-all; /* Ensure long strings break */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace; /* Match Tailwind mono stack */
  line-height: 1.5; /* Adjust line height for readability */
}
/* Basic styling for loading spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
