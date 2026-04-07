import { HomeHero } from "@/components/sections/home-hero";
import { HomeMission } from "@/components/sections/home-mission";
import { HomePrograms } from "@/components/sections/home-programs";
import { HomeStats } from "@/components/sections/home-stats";
import { HomeNewsletter } from "@/components/sections/home-newsletter";
import { HomeHighlights } from "@/components/sections/home-highlights";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeMission />
      <HomePrograms />
      <HomeStats />
      <HomeNewsletter />
      <HomeHighlights />
    </>
  );
}
