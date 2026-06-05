import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInInspirationBoard } from "@/components/temp/LinkedInInspirationBoard";
import "../linkedin-preview.css";
import "./linkedin-inspiration.css";

export default function LinkedInInspirationPage() {
  return (
    <div className="temp-linkedin-page">
      <BannerDesignNav />
      <LinkedInInspirationBoard />
    </div>
  );
}
