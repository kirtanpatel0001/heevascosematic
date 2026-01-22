import Image from "next/image";
import HeevasHeroSection from "./Home/HeevasHero";
import HeevasCareSection from "./Home/HeevasCare";
import HeevasFeaturesSection from "./Home/HeevasFeatures";
import HeevasProduct from "./Home/HeevasProduct";
import HeevasUseingSection from "./Home/HeevasUseing";
import ShopByConcern from "./Home/ShopByConcern";
import TrustBar from "./Home/TrustBar";

export default function Home() {
  return (
    <div>
      
      <HeevasHeroSection />
      <TrustBar />
      <ShopByConcern />
      <HeevasProduct />
      <HeevasFeaturesSection />
      <HeevasUseingSection />
      <HeevasCareSection />
    </div>
  );
}
