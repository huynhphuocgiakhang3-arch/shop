import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "KhangHuynh Vault", short_name: "KHVault", description: "Premium digital marketplace", start_url: "/", display: "standalone", background_color: "#05070c", theme_color: "#05070c", lang: "vi" }; }
