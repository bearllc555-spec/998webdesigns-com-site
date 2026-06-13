import type { Metadata } from "next";
import { BannerImageExportView } from "@/components/temp/BannerImageExportView";
import { BANNER_FEATURE_ROUTES } from "@/lib/linkedin-banner-preview";
import "../../../linkedin-export.css";
import "../../feature-banner.css";

const feature = BANNER_FEATURE_ROUTES[1];

export const metadata: Metadata = {
  title: { absolute: "Feature 2 - full image export" },
  robots: { index: false, follow: false },
};

export default function TempFeature2ExportPage() {
  return (
    <BannerImageExportView
      designLabel="Feature 2"
      imageSrc={feature.imageSrc}
      fileName="feature-2-linkedin.png"
    />
  );
}
