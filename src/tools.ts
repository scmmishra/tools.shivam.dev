import Secrets from "./pages/secrets.vue";
import Color from "./pages/color.vue";
import Hmac from "./pages/hmac.vue";
import Base64 from "./pages/base64.vue";
import Base64Encode from "./pages/base64-encode.vue";
import JWT from "./pages/jwt.vue";
import Diff from "./pages/diff.vue";
import WordCounter from "./pages/word-counter.vue";
import SqlFormatter from "./pages/sql-formatter.vue";
import JsonFormatter from "./pages/json-formatter.vue";
import NotificationTester from "./pages/notification-tester.vue";
import SecretSharing from "./pages/secret-sharing.vue";

export enum Category {
  Encoding = "encoding",
  Security = "security",
  CSS = "css",
  Text = "text",
  Dev = "dev",
}

export enum Tools {
  Color = "color",
  Hmac = "hmac",
  Secrets = "secrets",
  Base64 = "base64",
  Base64Encode = "base64-encode",
  JWT = "jwt",
  Diff = "diff",
  WordCounter = "word-counter",
  SqlFormatter = "sql-formatter",
  JsonFormatter = "json-formatter",
  NotificationTester = "notification-tester",
  SecretSharing = "secret-sharing",
}

export const tools = [
  {
    slug: Tools.Base64,
    title: "Base64 Decoder",
    component: Base64,
    description:
      "Decode Base64 encoded strings quickly and easily in your browser.",
    icon: "carbon:data-base",
    category: Category.Encoding,
  },
  {
    slug: Tools.Base64Encode,
    title: "Base64 Encoder",
    component: Base64Encode,
    description:
      "Encode strings to Base64 format quickly and easily in your browser.",
    icon: "carbon:data-base-alt",
    category: Category.Encoding,
  },
  {
    slug: Tools.JWT,
    title: "JWT Decoder",
    component: JWT,
    description:
      "Decode and inspect JSON Web Tokens (JWT) to view their header, payload, and signature.",
    category: Category.Security,
  },
  {
    slug: Tools.Color,
    title: "Color Converter",
    component: Color,
    description:
      "Convert colors between different formats (HEX, RGB, HSL, etc.) with a live preview.",
    category: Category.CSS,
  },
  {
    slug: Tools.Hmac,
    title: "HMAC Generator",
    component: Hmac,
    description:
      "Generate a Hash-based Message Authentication Code (HMAC) to verify message integrity and authenticity using your secret key.",
    category: Category.Security,
  },
  {
    slug: Tools.Secrets,
    title: "Secret Generator",
    component: Secrets,
    description:
      "Generate cryptographically secure secrets and passwords with configurable length and special characters.",
    category: Category.Security,
  },
  {
    slug: Tools.Diff,
    title: "Text Diff",
    component: Diff,
    description:
      "Compare two texts and see their differences highlighted, with support for character, word, and line-based diffing.",
    icon: "carbon:compare",
    category: Category.Text,
  },
  {
    slug: Tools.WordCounter,
    title: "Word Counter",
    component: WordCounter,
    description:
      "Count characters, words, sentences, and paragraphs in your text with real-time statistics.",
    icon: "carbon:text-annotation-toggle",
    category: Category.Text,
  },
  {
    slug: Tools.SqlFormatter,
    title: "SQL Formatter",
    component: SqlFormatter,
    description: "Format and beautify SQL queries with syntax highlighting.",
    icon: "carbon:data-base",
    category: Category.Dev,
  },
  {
    slug: Tools.JsonFormatter,
    title: "JSON Formatter",
    component: JsonFormatter,
    description:
      "Format and prettify your JSON data instantly in your browser.",
    icon: "mdi:code-json",
    category: Category.Dev,
  },
  {
    slug: Tools.NotificationTester,
    title: "Notification Tester",
    component: NotificationTester,
    description:
      "Test browser notifications with permission handling and delayed notifications.",
    icon: "carbon:notification",
    category: Category.Dev,
  },
  {
    slug: Tools.SecretSharing,
    title: "Secret Sharing",
    component: SecretSharing,
    description:
      "Encrypt a secret with a password and share it via a URL. Decrypts in the browser.",
    icon: "carbon:locked",
    category: Category.Security,
  },
];
