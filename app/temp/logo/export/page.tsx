import type { Metadata } from "next";
import { BANNER_LOGO } from "@/lib/linkedin-banner-preview";
import "../../linkedin-export.css";
import "../logo.css";

export const metadata: Metadata = {
  title: { absolute: "998 webdesigns logo — PNG export" },
  robots: { index: false, follow: false },
};

export default function TempLogoExportPage() {
  return (
    <div className="temp-page temp-page-logo linkedin-export-page logo-export-page">
      <div className="logo-preview-image-link logo-export-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BANNER_LOGO.imageSrc}
          alt="998 webdesigns logo"
          className="logo-preview-image"
        />
      </div>
      <a href={BANNER_LOGO.imageSrc} download="998webdesigns-logo.png" className="linkedin-export-download">
        Download PNG
      </a>
      <p className="linkedin-export-caption">
        {BANNER_LOGO.designLabel} — transparent PNG. Right-click the image →{" "}
        <strong>Save image as…</strong>
      </p>
    </div>
  );
}
