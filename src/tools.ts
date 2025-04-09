import Secrets from "./pages/secrets.vue";
import Color from "./pages/color.vue";
import Hmac from "./pages/hmac.vue";
import Base64 from "./pages/base64.vue";
import Base64Encode from "./pages/base64-encode.vue";
import JWT from "./pages/jwt.vue";

export enum Category {
  Encoding = "encoding",
  Security = "security",
  CSS = "css",
}

export enum Tools {
  Color = "color",
  Hmac = "hmac",
  Secrets = "secrets",
  Base64 = "base64",
  Base64Encode = "base64-encode",
  JWT = "jwt",
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
];
