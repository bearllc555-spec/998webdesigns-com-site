import Link from "next/link";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import {
  LINKEDIN_INSPIRATION_INTRO,
  LINKEDIN_INSPIRATION_PROFILES,
} from "@/data/linkedin-inspiration";
import "../linkedin-preview.css";
import "./linkedin-inspiration.css";

export default function LinkedInInspirationPage() {
  return (
    <div className="temp-linkedin-page">
      <BannerDesignNav />

      <div className="temp-linkedin-inner">
        <header className="temp-linkedin-header">
          <h1>LinkedIn profile inspiration</h1>
          <p>{LINKEDIN_INSPIRATION_INTRO}</p>
        </header>

        <ul className="temp-linkedin-list">
          {LINKEDIN_INSPIRATION_PROFILES.map((profile) => (
            <li key={profile.href} className="temp-linkedin-card">
              <a href={profile.href} target="_blank" rel="noopener noreferrer">
                {profile.name}
              </a>
              <p>{profile.summary}</p>
            </li>
          ))}
        </ul>

        <Link href="/temp" className="temp-linkedin-back">
          ← Back to banner designs
        </Link>
      </div>
    </div>
  );
}
