import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { BANNER_LOGO } from "@/lib/linkedin-banner-preview";
import "../linkedin-preview.css";
import "./logo.css";

export default function TempLogoPage() {
  return (
    <div className="temp-page temp-page-logo">
      <BannerDesignNav />

      <div className="logo-preview-wrap">
        <div className="logo-preview-meta">
          <h2>{BANNER_LOGO.designLabel}</h2>
          <p>
            Transparent PNG wordmark — Geist display, <strong>998</strong> in brand blue.{" "}
            <a href={BANNER_LOGO.exportHref}>Open full file</a>
          </p>
        </div>

        <a
          href={BANNER_LOGO.exportHref}
          className="logo-preview-image-link"
          title="Open logo PNG"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BANNER_LOGO.imageSrc}
            alt="998 webdesigns logo"
            className="logo-preview-image"
            decoding="async"
          />
        </a>
      </div>

      <p className="hint">Logo PNG — transparent background, not a LinkedIn banner format.</p>
    </div>
  );
}
