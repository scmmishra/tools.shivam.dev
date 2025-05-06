<template>
  <ToolLayout :name="Tools.SecretSharing">
    <div class="space-y-6">
      <TextArea
        id="secret"
        label="Secret Message"
        v-model="secretToEncrypt"
        placeholder="Enter the secret you want to share"
        :rows="6"
        auto-grow
      />

      <HiddenInput
        id="password-encrypt"
        label="Password"
        v-model="passwordForEncryption"
        placeholder="Password to protect the secret"
      />

      <button
        @click="encryptAndGenerateUrl"
        :disabled="!secretToEncrypt || !passwordForEncryption || isProcessing"
        class="text-sm w-full text-gray-100 hover:bg-gray-800 flex items-center gap-2 cursor-pointer bg-gray-900 py-3 justify-center px-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="!isProcessing" class="flex items-center gap-2">
          <IconLinkSimple class="h-4 w-4" />
          Create Secret Link
        </span>
        <span v-else class="flex items-center gap-2">
          <svg
            class="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      </button>

      <Result
        v-if="generatedUrl"
        title="Share this link"
        :value="generatedUrl"
        copyable
      />
      <Result
        v-if="errorMessage"
        title="Error"
        :value="errorMessage"
        type="error"
      />
    </div>
  </ToolLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextArea from "../components/form/TextArea.vue";
import HiddenInput from "../components/form/HiddenInput.vue";
import Result from "../components/Result.vue";
import IconLinkSimple from "~icons/ph/link-simple";

const secretToEncrypt = ref("");
const passwordForEncryption = ref("");
const generatedUrl = ref("");
const errorMessage = ref("");
const isProcessing = ref(false);

// --- Crypto Helper Functions (Keep these for encryption) ---

// Base64 URL Safe Encoding
function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-") // Convert '+' to '-'
    .replace(/\//g, "_") // Convert '/' to '_'
    .replace(/=/g, ""); // Remove padding
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
      iterations: 100000, // NIST recommendation
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"] // Keep 'decrypt' needed by deriveKey itself
  );
}

// Encrypt data using AES-GCM
async function encryptData(
  keyPassword: string,
  data: string
): Promise<{ iv: Uint8Array; salt: Uint8Array; ciphertext: ArrayBuffer }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits is recommended for GCM
  const salt = crypto.getRandomValues(new Uint8Array(16)); // 128 bits salt

  const derivedKey = await deriveKey(keyPassword, salt);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    derivedKey,
    enc.encode(data)
  );

  return { iv, salt, ciphertext };
}

// --- Component Logic (Encryption Only) ---

async function encryptAndGenerateUrl() {
  if (!secretToEncrypt.value || !passwordForEncryption.value) return;
  isProcessing.value = true;
  errorMessage.value = "";
  generatedUrl.value = "";

  try {
    const { iv, salt, ciphertext } = await encryptData(
      passwordForEncryption.value,
      secretToEncrypt.value
    );

    // Combine salt, IV, and ciphertext for the payload
    const saltEncoded = base64UrlEncode(salt.buffer);
    const ivEncoded = base64UrlEncode(iv.buffer);
    const ciphertextEncoded = base64UrlEncode(ciphertext);

    const payload = `${saltEncoded}.${ivEncoded}.${ciphertextEncoded}`;

    // Generate URL using the new /decrypt route
    const currentOrigin = window.location.origin;
    // Use '/decrypt/' path directly instead of manipulating hash
    generatedUrl.value = `${currentOrigin}/decrypt/${payload}`;
  } catch (error) {
    console.error("Encryption error:", error);
    errorMessage.value = "Encryption failed. Please try again.";
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style scoped>
/* Styles are mostly handled by ToolLayout and Tailwind utilities */
</style>
