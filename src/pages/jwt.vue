<script setup lang="ts">
import { ref, watch } from "vue";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextArea from "../components/form/TextArea.vue";
import Result from "../components/Result.vue";

interface JWTPayload {
  header: any;
  payload: any;
  signature: string;
}

const input = ref("");
const decoded = ref<JWTPayload | null>(null);
const error = ref("");

const decodeJWT = (token: string) => {
  try {
    const [headerB64, payloadB64, signature] = token.split(".");

    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));

    return {
      header,
      payload,
      signature,
    };
  } catch (e) {
    throw new Error("Invalid JWT format");
  }
};

watch(input, (value) => {
  try {
    error.value = "";
    if (!value) {
      decoded.value = null;
      return;
    }
    decoded.value = decodeJWT(value);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Invalid JWT";
    decoded.value = null;
  }
});

const updateInput = (newValue: string | undefined) => {
  input.value = newValue ?? "";
};
</script>

<template>
  <ToolLayout :name="Tools.JWT" :persist-keys="['jwt-input']">
    <div class="space-y-6">
      <TextArea
        id="jwt-input"
        label="JWT Token"
        placeholder="Enter your JWT here"
        v-model="input"
        @update="updateInput"
        persist="jwt-input"
      />

      <Result
        title="Header"
        placeholder="JWT header will appear here"
        :value="decoded ? JSON.stringify(decoded.header, null, 2) : ''"
      />

      <Result
        title="Payload"
        placeholder="JWT payload will appear here"
        :value="decoded ? JSON.stringify(decoded.payload, null, 2) : ''"
      />

      <Result
        title="Signature"
        placeholder="JWT signature will appear here"
        :value="decoded ? decoded.signature : ''"
      />

      <Result v-if="error" title="Error" :value="error" />
    </div>
  </ToolLayout>
</template>
