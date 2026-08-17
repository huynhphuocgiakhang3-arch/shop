"use client";

import { usePublicSiteSettings } from "@/hooks/useSiteSettings";

export function AuthBackgroundImage({ variant }: { variant: "login" | "register" }) {
  const { data } = usePublicSiteSettings();
  const url = variant === "login" ? data?.settings.loginBackgroundUrl : data?.settings.registerBackgroundUrl;

  if (!url) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: -15 }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary URL set at runtime by Super Admin, not a static/known asset */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      {/* Just enough of a scrim to keep form text/inputs readable — the
          glass panel itself is now deliberately much more transparent
          (see LoginGlassPanel) so the background stays the visible star,
          per "Background không được che / Background phải nổi bật". */}
      <div className="absolute inset-0 bg-bg-primary/55" />
    </div>
  );
}
