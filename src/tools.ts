import Secrets from "./pages/secrets.vue";
import Color from "./pages/color.vue";
import Hmac from "./pages/hmac.vue";

export enum Tools {
  Color = "color",
  Hmac = "hmac",
  Secrets = "secrets",
}

export const tools = [
  {
    slug: Tools.Color,
    title: "Color Converter",
    component: Color,
    description:
      "Convert colors between different formats (HEX, RGB, HSL, etc.) with a live preview.",
  },
  {
    slug: Tools.Hmac,
    title: "HMAC Generator",
    component: Hmac,
    description:
      "Generate a Hash-based Message Authentication Code (HMAC) to verify message integrity and authenticity using your secret key.",
  },
  {
    slug: Tools.Secrets,
    title: "Secret Generator",
    component: Secrets,
    description:
      "Generate cryptographically secure secrets and passwords with configurable length and special characters.",
  },
];
