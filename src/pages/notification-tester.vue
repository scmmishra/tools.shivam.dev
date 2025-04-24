<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";

const notificationStatus = ref("");
const error = ref("");
const currentBrowser = ref("");

const browserSettingsPath = computed(() => {
  switch (currentBrowser.value) {
    case "chrome":
      return "Settings > Privacy and Security > Site Settings > Notifications";
    case "firefox":
      return "Settings > Privacy & Security > Permissions > Notifications";
    case "safari":
      return "System Settings > Safari > Websites > Notifications";
    case "edge":
      return "Settings > Cookies and Site Permissions > Notifications";
    default:
      return "Please check your browser's notification settings";
  }
});

onMounted(() => {
  // Detect browser
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    currentBrowser.value = "chrome";
  } else if (userAgent.includes("Firefox")) {
    currentBrowser.value = "firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    currentBrowser.value = "safari";
  } else if (userAgent.includes("Edg")) {
    currentBrowser.value = "edge";
  }
});

async function requestPermission() {
  try {
    const permission = await Notification.requestPermission();
    notificationStatus.value = `Notification permission: ${permission}`;
    error.value = "";
  } catch (err) {
    error.value = (err as Error).message;
  }
}

function sendNotification() {
  try {
    if (Notification.permission !== "granted") {
      error.value = "Please allow notifications first";
      return;
    }

    new Notification("Test Notification", {
      body: "This is a test notification",
      icon: "/favicon.ico",
    });
    error.value = "";
  } catch (err) {
    error.value = (err as Error).message;
  }
}

function sendDelayedNotification() {
  try {
    if (Notification.permission !== "granted") {
      error.value = "Please allow notifications first";
      return;
    }

    setTimeout(() => {
      new Notification("Delayed Test Notification", {
        body: "This notification was sent after 5 seconds",
        icon: "/favicon.ico",
      });
    }, 5000);
    error.value = "";
  } catch (err) {
    error.value = (err as Error).message;
  }
}
</script>

<template>
  <ToolLayout :name="Tools.NotificationTester">
    <div class="space-y-6">
      <div class="prose dark:prose-invert max-w-none">
        <h3 class="mb-1 text-gray-600">How to test notifications</h3>
        <ol class="list-decimal list-inside mb-0 text-gray-600">
          <li>Click "Allow Notifications" to request permission</li>
          <li>Once allowed, use the buttons below to test notifications</li>
          <li>
            If notifications don't work, check your browser settings:
            <span class="text-gray-800 font-medium">{{
              browserSettingsPath
            }}</span>
          </li>
        </ol>
      </div>

      <div class="space-y-4">
        <button
          class="w-full px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded hover:bg-gray-50 transition-colors"
          @click="requestPermission"
        >
          Allow Notifications
        </button>

        <button
          class="w-full px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded hover:bg-gray-50 transition-colors"
          @click="sendNotification"
        >
          Send Notification
        </button>

        <button
          class="w-full px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded hover:bg-gray-50 transition-colors"
          @click="sendDelayedNotification"
        >
          Send in 5 Seconds
        </button>
      </div>

      <div
        v-if="notificationStatus"
        class="text-sm text-gray-600 dark:text-gray-400"
      >
        {{ notificationStatus }}
      </div>

      <div v-if="error" class="text-sm text-red-600 dark:text-red-400">
        Error: {{ error }}
      </div>

      <details class="mt-8 group">
        <summary
          class="text-gray-600 hover:text-gray-800 cursor-pointer select-none"
        >
          Still having issues? View debugging steps
        </summary>

        <div class="mt-4 space-y-6 text-gray-600">
          <div>
            <h4 class="font-medium mb-2">macOS</h4>
            <ol class="list-decimal list-inside space-y-1">
              <li>Open System Settings > Notifications</li>
              <li>Ensure notifications are enabled for your browser</li>
              <li>Check "Allow notifications when using this browser"</li>
              <li>Try turning Do Not Disturb off</li>
              <li>Restart your browser</li>
            </ol>
          </div>

          <div>
            <h4 class="font-medium mb-2">Windows</h4>
            <ol class="list-decimal list-inside space-y-1">
              <li>Open Start > Settings > System > Notifications</li>
              <li>Enable notifications for your browser</li>
              <li>Check Focus assist settings</li>
              <li>
                Verify Windows Security Center isn't blocking notifications
              </li>
              <li>Restart your browser</li>
            </ol>
          </div>

          <div>
            <h4 class="font-medium mb-2">Linux</h4>
            <ol class="list-decimal list-inside space-y-1">
              <li>Check your desktop environment's notification settings</li>
              <li>
                Ensure notification daemon is running (e.g., dunst, notify-osd)
              </li>
              <li>Verify system notifications are enabled</li>
              <li>Check your distro's specific notification center</li>
              <li>
                Try: <code>notify-send "Test" "Notification"</code> in terminal
              </li>
            </ol>
          </div>

          <div class="text-xs bg-gray-50 p-4 rounded">
            <p>
              Note: If you've tried all steps and notifications still don't
              work:
            </p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>Try a different browser</li>
              <li>Check for browser extensions blocking notifications</li>
              <li>Ensure you're not in incognito/private mode</li>
              <li>Clear browser cache and cookies</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  </ToolLayout>
</template>
